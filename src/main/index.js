const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const si = require('systeminformation')
const axios = require('axios')
const crypto = require('crypto')
const { exec } = require('child_process')
const mammoth = require('mammoth')
const WordExtractor = require('word-extractor')
// const pdfParse = require('pdf-parse')  // PDF解析在Electron主进程中有兼容性问题，暂时禁用
const XLSX = require('xlsx')

const wordExtractor = new WordExtractor()

let mainWindow
let aiConfig = {
  provider: 'openai',
  apiKey: null,
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1'
}
let fileIndex = [] // 简单的内存索引
let organizeHistory = [] // 文件整理操作历史（用于撤回）

// 注册Windows右键菜单
function registerContextMenu(appPath) {
  const regKey = 'HKEY_CLASSES_ROOT\\*\\shell\\AIRename'
  const command = `"${appPath}" --ai-rename "%1"`

  const regCommands = [
    `reg add "${regKey}" /ve /d "AI智能重命名" /f`,
    `reg add "${regKey}" /v "Icon" /d "${appPath}" /f`,
    `reg add "${regKey}\\command" /ve /d "${command}" /f`
  ]

  return new Promise((resolve, reject) => {
    let completed = 0
    regCommands.forEach(cmd => {
      exec(cmd, (error) => {
        if (error) reject(error)
        else {
          completed++
          if (completed === regCommands.length) resolve()
        }
      })
    })
  })
}

// 卸载Windows右键菜单
function unregisterContextMenu() {
  const regKey = 'HKEY_CLASSES_ROOT\\*\\shell\\AIRename'
  return new Promise((resolve, reject) => {
    exec(`reg delete "${regKey}" /f`, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

// 检查命令行参数
let aiRenameFile = false
let targetFile = null

// 在生产环境中检查命令行参数
if (app.isPackaged) {
  const args = process.argv.slice(1)
  const aiRenameIndex = args.findIndex(arg => arg === '--ai-rename')
  aiRenameFile = aiRenameIndex !== -1
  targetFile = aiRenameFile && args[aiRenameIndex + 1] ? args[aiRenameIndex + 1] : null
}

// 文件服务
async function scanDirectory(dirPath) {
  const files = []
  const items = await fs.readdir(dirPath, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name)
    if (item.isFile()) {
      const stats = await fs.stat(fullPath)
      files.push({
        name: item.name,
        path: fullPath,
        size: stats.size,
        modified: stats.mtime,
        ext: path.extname(item.name)
      })
    }
  }
  return files
}

// 计算文件哈希
async function getFileHash(filePath) {
  const buffer = await fs.readFile(filePath)
  return crypto.createHash('md5').update(buffer).digest('hex')
}

// 查找重复文件
async function findDuplicates(dirPath) {
  const files = await scanDirectory(dirPath)
  const hashMap = new Map()

  for (const file of files) {
    try {
      const hash = await getFileHash(file.path)
      if (!hashMap.has(hash)) {
        hashMap.set(hash, [])
      }
      hashMap.get(hash).push(file)
    } catch (error) {
      console.error(`无法读取文件 ${file.path}:`, error.message)
    }
  }

  // 只返回有重复的文件组
  return Array.from(hashMap.values()).filter(group => group.length > 1)
}

// 递归扫描并建立索引
async function buildFileIndex(dirPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name)

      if (item.isFile()) {
        const stats = await fs.stat(fullPath)
        fileIndex.push({
          name: item.name,
          path: fullPath,
          size: stats.size,
          modified: stats.mtime,
          ext: path.extname(item.name),
          dir: dirPath
        })
      } else if (item.isDirectory()) {
        await buildFileIndex(fullPath, maxDepth, currentDepth + 1)
      }
    }
  } catch (error) {
    // 跳过无权限的目录
  }
}

// 智能搜索
async function smartSearch(query) {
  const lowerQuery = query.toLowerCase()

  return fileIndex.filter(file => {
    return file.name.toLowerCase().includes(lowerQuery) ||
           file.path.toLowerCase().includes(lowerQuery)
  }).slice(0, 100)
}

// AI语义搜索
async function aiSemanticSearch(searchParams) {
  const { query, filters } = searchParams
  let filteredFiles = [...fileIndex]

  // 1. 应用过滤条件
  if (filters.extensions && filters.extensions.length > 0) {
    const allowedExts = filters.extensions.flatMap(group => group.split(','))
    filteredFiles = filteredFiles.filter(file =>
      allowedExts.some(ext => file.ext.toLowerCase() === ext.toLowerCase())
    )
  }

  if (filters.createTimeRange) {
    const [start, end] = filters.createTimeRange
    filteredFiles = filteredFiles.filter(file => {
      const birthtime = new Date(file.birthtime).getTime()
      return birthtime >= start && birthtime <= end
    })
  }

  if (filters.modifyTimeRange) {
    const [start, end] = filters.modifyTimeRange
    filteredFiles = filteredFiles.filter(file => {
      const mtime = new Date(file.modified).getTime()
      return mtime >= start && mtime <= end
    })
  }

  // 限制最多分析100个文件
  filteredFiles = filteredFiles.slice(0, 100)

  if (!filters.useAI) {
    // 不使用AI，只返回过滤后的文件
    return filteredFiles.map(file => ({ ...file, relevance: null }))
  }

  // 2. 使用AI分析相关性
  const results = []
  for (const file of filteredFiles) {
    try {
      let fileContent = ''
      const stats = await fs.stat(file.path)
      const contentLength = filters.contentLength || 2000

      // 读取文件内容
      const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.py', '.java', '.cpp']
      if (textExtensions.includes(file.ext) && stats.size < 200 * 1024) {
        fileContent = await fs.readFile(file.path, 'utf-8')
        fileContent = fileContent.substring(0, contentLength)
      } else if (file.ext === '.docx' && stats.size < 5 * 1024 * 1024) {
        const buffer = await fs.readFile(file.path)
        const result = await mammoth.extractRawText({ buffer })
        fileContent = result.value.substring(0, contentLength)
      } else if (file.ext === '.doc' && stats.size < 5 * 1024 * 1024) {
        const extracted = await wordExtractor.extract(file.path)
        fileContent = extracted.getBody().substring(0, contentLength)
      } else if (['.xlsx', '.xls'].includes(file.ext) && stats.size < 5 * 1024 * 1024) {
        const workbook = XLSX.readFile(file.path)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        fileContent = XLSX.utils.sheet_to_csv(sheet).substring(0, contentLength)
      }

      if (fileContent) {
        // 调用AI判断相关性
        const relevance = await calculateRelevance(query, file.name, fileContent)
        results.push({ ...file, relevance })
      } else {
        // 无法读取内容，只根据文件名判断
        const relevance = await calculateRelevanceByName(query, file.name)
        results.push({ ...file, relevance })
      }
    } catch (error) {
      console.log('分析文件失败:', file.name, error.message)
      results.push({ ...file, relevance: 0 })
    }
  }

  // 按相关性排序，过滤掉相关性低于20%的
  return results
    .filter(r => r.relevance >= 20)
    .sort((a, b) => b.relevance - a.relevance)
}

// 计算文件相关性（有内容）
async function calculateRelevance(userQuery, fileName, fileContent) {
  const prompt = `你是一个文件搜索助手。用户正在寻找文件，请判断这个文件与用户需求的相关性。

用户需求：${userQuery}

文件名：${fileName}
文件内容（前${fileContent.length}字符）：
${fileContent}

请分析这个文件与用户需求的相关性，只输出一个0-100之间的整数，表示相关性百分比。
- 90-100: 非常相关，完全符合用户需求
- 70-89: 高度相关，大部分符合
- 50-69: 中等相关，部分符合
- 30-49: 低度相关，略微相关
- 0-29: 不相关或几乎不相关

只输出数字，不要有任何解释：`

  try {
    const result = await callAI(prompt)
    const relevance = parseInt(result.trim())
    return isNaN(relevance) ? 0 : Math.min(100, Math.max(0, relevance))
  } catch (error) {
    console.error('AI计算相关性失败:', error.message)
    return 0
  }
}

// 计算文件相关性（仅文件名）
async function calculateRelevanceByName(userQuery, fileName) {
  const prompt = `用户正在寻找：${userQuery}

文件名：${fileName}

仅根据文件名判断相关性（0-100的整数），只输出数字：`

  try {
    const result = await callAI(prompt)
    const relevance = parseInt(result.trim())
    return isNaN(relevance) ? 0 : Math.min(100, Math.max(0, relevance))
  } catch (error) {
    return 0
  }
}

// 系统信息服务
async function getSystemInfo() {
  const [cpu, mem, disk, os] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.fsSize(),
    si.osInfo()
  ])

  return {
    cpu: {
      model: cpu.brand,
      cores: cpu.cores,
      speed: cpu.speed
    },
    memory: {
      total: mem.total,
      used: mem.used,
      free: mem.free
    },
    disk: disk.map(d => ({
      fs: d.fs,
      size: d.size,
      used: d.used,
      available: d.available,
      use: d.use
    })),
    os: {
      platform: os.platform,
      distro: os.distro,
      release: os.release
    }
  }
}

// 获取进程列表
async function getProcessList() {
  const processes = await si.processes()
  return processes.list
    .sort((a, b) => b.memRss - a.memRss)
    .slice(0, 50)
    .map(p => ({
      pid: p.pid,
      name: p.name,
      cpu: p.cpu,
      memory: p.memRss
    }))
}

// 获取启动项
async function getStartupApps() {
  // Windows启动项通常在注册表中
  // 这里返回模拟数据，实际需要读取注册表
  return []
}

// AI服务 - 通用调用函数（带重试机制）
async function callAI(prompt, retries = 2) {
  if (!aiConfig.apiKey) {
    throw new Error('请先在设置中配置AI API密钥')
  }

  const { provider, apiKey, model, baseUrl } = aiConfig

  console.log('AI配置:', { provider, model, baseUrl, apiKeyLength: apiKey?.length })

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`第 ${attempt + 1} 次尝试...`)
      }

      // Claude API (官方格式 - 使用 x-api-key)
      if (provider === 'claude') {
        console.log('使用Claude官方API')
        const requestData = {
          model: model,
          max_tokens: 300,  // 增加到300以支持更详细的文件名
          messages: [{ role: 'user', content: prompt }]
        }
        console.log('请求数据:', JSON.stringify(requestData, null, 2))

        const response = await axios.post(
          `${baseUrl}/messages`,
          requestData,
          {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            timeout: 60000  // 增加到60秒
          }
        )
        return response.data.content[0].text
      }

      // 0011.ai 中转 (Claude格式但使用 Authorization)
      else if (provider === '0011ai') {
        console.log('使用0011.ai中转API')
        const requestData = {
          model: model,
          max_tokens: 300,  // 增加到300以支持更详细的文件名
          messages: [{ role: 'user', content: prompt }]
        }
        console.log('请求数据:', JSON.stringify(requestData, null, 2))

        const response = await axios.post(
          `${baseUrl}/messages`,
          requestData,
          {
            headers: {
              'Authorization': apiKey,
              'Content-Type': 'application/json'
            },
            timeout: 60000  // 增加到60秒
          }
        )
        return response.data.content[0].text
      }

      // OpenAI格式 (适用于大多数国产AI)
      else {
        console.log('使用OpenAI格式API')
        const response = await axios.post(
          `${baseUrl}/chat/completions`,
          {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300  // 增加到300以支持更详细的文件名
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000  // 增加到60秒
          }
        )
        return response.data.choices[0].message.content
      }
    } catch (error) {
      console.error(`AI调用错误 (尝试 ${attempt + 1}/${retries + 1}):`, error.response?.data || error.message)

      // 如果是最后一次尝试，抛出错误
      if (attempt === retries) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message
        const statusCode = error.response?.status || '未知'
        throw new Error(`AI服务调用失败 (${statusCode})：${errorMsg}`)
      }

      // 等待2秒后重试
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

async function suggestFileName(filePath) {
  const fileName = path.basename(filePath)
  const ext = path.extname(filePath).toLowerCase()

  // 尝试读取文件内容
  let fileContent = ''

  try {
    const stats = await fs.stat(filePath)

    // 纯文本文件
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.xml', '.csv', '.log']
    if (textExtensions.includes(ext) && stats.size < 200 * 1024) {
      const content = await fs.readFile(filePath, 'utf-8')
      fileContent = content.substring(0, 2000)
    }

    // Word文档 (.docx - 新版)
    else if (ext === '.docx' && stats.size < 5 * 1024 * 1024) {
      console.log('正在读取.docx文档...')
      const buffer = await fs.readFile(filePath)
      const result = await mammoth.extractRawText({ buffer })
      fileContent = result.value.substring(0, 2000)
      console.log('.docx文档读取成功，内容长度:', fileContent.length)
    }

    // Word文档 (.doc - 旧版)
    else if (ext === '.doc' && stats.size < 5 * 1024 * 1024) {
      console.log('正在读取.doc文档...')
      const extracted = await wordExtractor.extract(filePath)
      fileContent = extracted.getBody().substring(0, 2000)
      console.log('.doc文档读取成功，内容长度:', fileContent.length)
    }

    // PDF文档 - 暂时不支持（在Electron主进程中有兼容性问题）
    // else if (ext === '.pdf' && stats.size < 5 * 1024 * 1024) {
    //   console.log('PDF文档暂不支持内容读取，将根据文件名推测')
    // }

    // Excel文档 (.xlsx, .xls)
    else if (['.xlsx', '.xls'].includes(ext) && stats.size < 5 * 1024 * 1024) {
      console.log('正在读取Excel文档...')
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const csvContent = XLSX.utils.sheet_to_csv(sheet)
      fileContent = csvContent.substring(0, 2000)
      console.log('Excel文档读取成功，内容长度:', fileContent.length)
    }

  } catch (error) {
    console.log('无法读取文件内容:', error.message)
  }

  let prompt
  if (fileContent) {
    prompt = `你是一个专业的文件管理助手。请仔细分析文件内容，提取所有关键信息，生成一个详细、精确、信息完整的文件名。

文件内容：
${fileContent}

【分析要求】
请逐步分析文件内容，提取以下所有信息：

1. **文档核心主题**：
   - 具体的主题名称（不要泛泛而谈，要具体）
   - 如果是作业/论文，提取题目或核心问题
   - 如果是报告，提取报告的具体对象或事件
   - 如果是技术文档，提取具体的技术名称、版本、功能模块

2. **文档类型**：
   - 明确类型：作业、实验报告、课程论文、毕业论文、项目方案、技术文档、会议记录、数据分析、总结报告等
   - 如果有章节编号或序号，包含进去（如"第3章"、"实验二"）

3. **所属领域/课程/项目**：
   - 具体的课程名称（如"计算机组成原理"、"数据结构"）
   - 具体的项目名称或业务领域
   - 技术栈或技术方向（如"Spring Boot"、"React"、"机器学习"）

4. **时间信息**（如果有）：
   - 学期、年份、日期
   - 版本号（如"v1.0"、"最终版"）

5. **编写者信息**（如果有）：
   - 姓名（完整姓名）
   - 学号（完整学号）
   - 工号（完整工号）
   - 班级或部门

6. **其他重要信息**：
   - 指导老师姓名
   - 分数或成绩
   - 特殊标记（如"已提交"、"待修改"）

【文件名格式】
[具体主题]-[文档类型]-[所属领域/课程]-[时间/版本]-[编写者姓名]-[学号/工号]

【示例】
- "计算机组成及体系结构第3章练习题-课后作业-计算机组成原理-2024春季-张三-2021001234"
- "基于SpringBoot的电商系统用户模块设计-毕业论文-软件工程-2024届-李四-学号20200567"
- "人工智能在医疗诊断中的应用研究-课程论文-人工智能导论-2024年6月-王五-2021123456"
- "Python数据分析实验二Pandas数据处理-实验报告-数据科学基础-第8周-赵六-工号E12345"
- "公司2024年第一季度销售数据分析-季度报告-市场部-2024Q1-钱七-部门经理"

【重要要求】
1. 必须包含文件中的具体信息，不要用泛泛的描述
2. 如果文件中有标题，优先使用标题中的关键词
3. 如果文件中有明确的课程名、项目名，必须包含
4. 如果文件中有姓名、学号、工号，必须完整包含
5. 用短横线"-"分隔各部分
6. 总长度控制在80字以内（可以适当省略次要信息）
7. 【关键】只输出文件名本身，不要有任何解释、前缀、后缀
8. 【关键】不要说"我需要..."、"这是..."、"建议"等话，直接输出文件名

直接输出文件名：`
  } else {
    prompt = `你是一个专业的文件管理助手。请根据文件路径和文件名，深入推测文件内容并生成一个详细、精确的文件名。

文件路径：${filePath}
当前文件名：${fileName}

【分析要求】
请仔细分析文件名中的所有信息：

1. **识别关键词**：
   - 从文件名中提取所有有意义的词汇
   - 识别数字、日期、版本号
   - 识别人名、课程名、项目名的缩写或全称

2. **推测文档类型**：
   - 根据文件名特征判断：作业、报告、论文、数据、代码、图片等
   - 识别可能的序号（如"练习题1"、"实验2"、"第3章"）

3. **推测所属领域**：
   - 从文件名推测可能的课程、项目、业务领域
   - 识别技术栈或专业方向

4. **提取编号信息**：
   - 学号、工号、日期、版本号等

【文件名格式】
[推测的具体主题]-[文档类型]-[推测的领域/课程]-[提取的编号信息]

【示例】
- "计算机组成练习题(1)(1)(2).docx" → "计算机组成及体系结构练习题第1-2次-课后作业-计算机组成原理"
- "report_final_v2.docx" → "项目最终报告第2版-项目文档-工作汇报"
- "2024_data_analysis.xlsx" → "2024年数据分析-数据表-业务分析"
- "张三_20210001_作业3.docx" → "第3次作业-课程作业-张三-学号20210001"

【重要要求】
1. 尽可能从文件名中提取所有有用信息
2. 对于重复的括号或数字，合理解释（如多次修改、多个版本）
3. 用短横线"-"分隔各部分
4. 总长度控制在50字以内
5. 【关键】只输出文件名本身，不要有任何解释
6. 【关键】不要说"我需要..."、"这是..."等话，直接输出文件名

直接输出文件名：`
  }

  const result = await callAI(prompt)
  // 清理可能的多余内容
  let cleanName = result.trim()
    .replace(/^["'「『]|["'」』]$/g, '')  // 移除引号
    .replace(/^建议的?文件名[：:]\s*/i, '')  // 移除"建议的文件名："
    .replace(/^新?文件名[：:]\s*/i, '')  // 移除"新文件名："
    .replace(/^文件名[：:]\s*/i, '')  // 移除"文件名："
    .split('\n')[0]  // 只取第一行
    .trim()

  // 如果AI返回的是解释性文字（包含"我需要"、"这是"、"这看起来"等），则使用原文件名
  const invalidPhrases = ['我需要', '这是', '这看起来', '我无法', '抱歉', '对不起', '请', '应该', '可以', '需要先']
  const hasInvalidPhrase = invalidPhrases.some(phrase => cleanName.includes(phrase))

  if (hasInvalidPhrase || cleanName.length > 100 || cleanName.length < 3) {
    console.log('AI返回了无效的文件名，使用基于原文件名的简化版本')
    // 对于无法读取内容的文件（如.docx），生成一个基于原文件名的简化版本
    const baseName = path.basename(fileName, ext)
    cleanName = `${baseName}-文档`
  }

  return cleanName
}

// ==================== 文件整理功能 ====================

// 文件类型分类映射
const FILE_CATEGORIES = {
  '文档': ['.doc', '.docx', '.pdf', '.txt', '.md', '.rtf', '.odt', '.pages'],
  '图片': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'],
  '视频': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
  '音频': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
  '压缩包': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
  '安装包': ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm'],
  '代码': ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'],
  '表格': ['.xlsx', '.xls', '.csv', '.numbers'],
  '演示文稿': ['.ppt', '.pptx', '.key']
}

// 基础分类函数
function getBasicCategory(ext) {
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext.toLowerCase())) {
      return category
    }
  }
  return '其他'
}

// 按时间分类
function getTimeCategory(modifiedDate) {
  const now = new Date()
  const fileDate = new Date(modifiedDate)
  const diffDays = Math.floor((now - fileDate) / (1000 * 60 * 60 * 24))

  if (diffDays <= 7) return '本周'
  if (diffDays <= 30) return '本月'
  if (diffDays <= 90) return '近三个月'
  return '更早'
}

// AI分析文件内容，返回智能分类
async function analyzeFileContent(filePath, fileName, fileContent) {
  const prompt = `你是一个专业的文件分类助手。请分析文件内容，判断它属于以下哪个类别：

文件名：${fileName}
文件内容（前2000字符）：
${fileContent}

【分类选项】
1. 工作文档 - 工作相关的报告、方案、合同、会议记录等
2. 学习资料 - 课程作业、笔记、论文、教材、练习题等
3. 个人文档 - 个人日记、计划、总结、备忘录等
4. 项目文件 - 技术文档、代码说明、项目方案、需求文档等
5. 娱乐内容 - 小说、漫画、游戏相关、娱乐视频等
6. 财务文档 - 账单、发票、报销单、财务报表等
7. 其他

【要求】
1. 只输出一个类别名称，不要有任何解释
2. 如果无法判断，输出"其他"

直接输出类别：`

  try {
    const result = await callAI(prompt)
    const category = result.trim()
    const validCategories = ['工作文档', '学习资料', '个人文档', '项目文件', '娱乐内容', '财务文档', '其他']
    return validCategories.includes(category) ? category : '其他'
  } catch (error) {
    console.error('AI分类失败:', error.message)
    return '其他'
  }
}

// 扫描并分类文件
async function organizeFiles(dirPath, useAI = false) {
  const files = await scanDirectory(dirPath)
  const organized = []

  for (const file of files) {
    const basicCategory = getBasicCategory(file.ext)
    const timeCategory = getTimeCategory(file.modified)

    let smartCategory = null
    if (useAI) {
      try {
        let fileContent = ''
        const stats = await fs.stat(file.path)

        const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.css', '.html']
        if (textExtensions.includes(file.ext) && stats.size < 200 * 1024) {
          fileContent = await fs.readFile(file.path, 'utf-8')
          fileContent = fileContent.substring(0, 2000)
        } else if (file.ext === '.docx' && stats.size < 5 * 1024 * 1024) {
          const buffer = await fs.readFile(file.path)
          const result = await mammoth.extractRawText({ buffer })
          fileContent = result.value.substring(0, 2000)
        } else if (file.ext === '.doc' && stats.size < 5 * 1024 * 1024) {
          const extracted = await wordExtractor.extract(file.path)
          fileContent = extracted.getBody().substring(0, 2000)
        } else if (['.xlsx', '.xls'].includes(file.ext) && stats.size < 5 * 1024 * 1024) {
          const workbook = XLSX.readFile(file.path)
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          fileContent = XLSX.utils.sheet_to_csv(sheet).substring(0, 2000)
        }

        if (fileContent) {
          smartCategory = await analyzeFileContent(file.path, file.name, fileContent)
        }
      } catch (error) {
        console.log('无法分析文件:', file.name, error.message)
      }
    }

    organized.push({
      ...file,
      basicCategory,
      smartCategory,
      timeCategory
    })
  }

  return organized
}

// 执行文件整理（移动文件）
async function executeOrganize(operations) {
  const results = []
  const historyRecord = {
    timestamp: new Date().toISOString(),
    operations: []
  }

  for (const op of operations) {
    try {
      const { sourcePath, targetPath } = op

      await fs.ensureDir(path.dirname(targetPath))

      if (await fs.pathExists(targetPath)) {
        const ext = path.extname(targetPath)
        const baseName = path.basename(targetPath, ext)
        const dir = path.dirname(targetPath)
        let counter = 1
        let newPath = targetPath

        while (await fs.pathExists(newPath)) {
          newPath = path.join(dir, `${baseName}(${counter})${ext}`)
          counter++
        }

        await fs.move(sourcePath, newPath)
        results.push({ success: true, from: sourcePath, to: newPath })
        historyRecord.operations.push({ from: sourcePath, to: newPath })
      } else {
        await fs.move(sourcePath, targetPath)
        results.push({ success: true, from: sourcePath, to: targetPath })
        historyRecord.operations.push({ from: sourcePath, to: targetPath })
      }
    } catch (error) {
      results.push({ success: false, from: op.sourcePath, error: error.message })
    }
  }

  // 只有成功的操作才记录到历史
  if (historyRecord.operations.length > 0) {
    organizeHistory.push(historyRecord)
    // 只保留最近10次操作历史
    if (organizeHistory.length > 10) {
      organizeHistory.shift()
    }
  }

  return results
}

// 撤回最近一次整理操作
async function undoOrganize() {
  if (organizeHistory.length === 0) {
    throw new Error('没有可撤回的操作')
  }

  const lastOperation = organizeHistory.pop()
  const results = []

  for (const op of lastOperation.operations) {
    try {
      // 将文件从目标位置移回原位置
      await fs.move(op.to, op.from)
      results.push({ success: true, from: op.to, to: op.from })
    } catch (error) {
      results.push({ success: false, from: op.to, error: error.message })
    }
  }

  return {
    success: true,
    timestamp: lastOperation.timestamp,
    results
  }
}

// 获取整理历史
function getOrganizeHistory() {
  return organizeHistory.map(record => ({
    timestamp: record.timestamp,
    fileCount: record.operations.length
  }))
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'AI文件整理',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 强制使用生产模式路径
  const isDev = process.env.NODE_ENV === 'development'
  console.log('isDev:', isDev)
  console.log('NODE_ENV:', process.env.NODE_ENV)

  if (isDev) {
    // 尝试多个可能的端口
    const tryPorts = [5173, 5174, 5175, 5176]
    let loaded = false

    for (const port of tryPorts) {
      try {
        const url = `http://localhost:${port}`
        console.log('Trying to load:', url)
        await mainWindow.loadURL(url)
        console.log('Successfully loaded from:', url)
        loaded = true
        break
      } catch (error) {
        console.log(`Port ${port} failed, trying next...`)
      }
    }

    if (!loaded) {
      console.error('Failed to load dev server from any port')
    }

    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境：使用正确的路径
    const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html')
    console.log('Loading renderer from:', rendererPath)
    console.log('__dirname:', __dirname)
    mainWindow.loadFile(rendererPath).catch(err => {
      console.error('Failed to load renderer:', err)
    })
  }

  // 打开开发者工具查看错误
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(async () => {
  // 加载保存的AI配置
  const configPath = path.join(app.getPath('userData'), 'config.json')
  if (await fs.pathExists(configPath)) {
    const config = await fs.readJson(configPath)
    aiConfig = { ...aiConfig, ...config }
  }

  // 如果是从右键菜单启动的
  if (aiRenameFile && targetFile) {
    await handleContextMenuRename(targetFile)
    app.quit()
    return
  }

  createWindow()
  registerIpcHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 处理右键菜单的AI重命名
async function handleContextMenuRename(filePath) {
  try {
    // 从配置文件读取AI配置
    const configPath = path.join(app.getPath('userData'), 'config.json')
    let config = {}

    if (await fs.pathExists(configPath)) {
      config = await fs.readJson(configPath)
      aiConfig = { ...aiConfig, ...config }
    }

    if (!aiConfig.apiKey) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'AI电脑管家',
        message: '请先在应用中配置AI API密钥\n\n打开应用 → 设置 → 保存配置',
        buttons: ['确定']
      })
      return
    }

    const newName = await suggestFileName(filePath)
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'AI智能重命名',
      message: `当前文件：${path.basename(filePath)}\n\nAI建议的文件名：\n${newName}\n\n是否重命名？`,
      buttons: ['重命名', '取消'],
      defaultId: 0,
      cancelId: 1
    })

    if (result.response === 0) {
      const dir = path.dirname(filePath)
      const ext = path.extname(filePath)
      const newPath = path.join(dir, newName + ext)
      await fs.rename(filePath, newPath)
      await dialog.showMessageBox({
        type: 'info',
        title: '成功',
        message: '文件已重命名！',
        buttons: ['确定']
      })
    }
  } catch (error) {
    await dialog.showMessageBox({
      type: 'error',
      title: '错误',
      message: `操作失败：\n${error.message}`,
      buttons: ['确定']
    })
  }
}

function registerIpcHandlers() {
  ipcMain.handle('scan-directory', async (event, dirPath) => {
    return await scanDirectory(dirPath)
  })

  ipcMain.handle('get-system-info', async () => {
    return await getSystemInfo()
  })

  ipcMain.handle('ai-rename-file', async (event, filePath) => {
    return await suggestFileName(filePath)
  })

  ipcMain.handle('search-files', async (event, query) => {
    return await smartSearch(query)
  })

  // AI语义搜索
  ipcMain.handle('ai-search-files', async (event, searchParams) => {
    return await aiSemanticSearch(searchParams)
  })

  // 检查是否已同意免责声明
  ipcMain.handle('check-disclaimer-agreed', async () => {
    const configPath = path.join(app.getPath('userData'), 'disclaimer-agreed.json')
    try {
      if (await fs.pathExists(configPath)) {
        const data = await fs.readJson(configPath)
        return data.agreed === true
      }
    } catch (error) {
      console.error('读取免责声明状态失败:', error)
    }
    return false
  })

  // 保存用户同意免责声明
  ipcMain.handle('save-disclaimer-agreed', async () => {
    const configPath = path.join(app.getPath('userData'), 'disclaimer-agreed.json')
    try {
      await fs.writeJson(configPath, {
        agreed: true,
        timestamp: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('保存免责声明状态失败:', error)
      return false
    }
  })

  ipcMain.handle('build-index', async (event, dirPath) => {
    fileIndex = []
    await buildFileIndex(dirPath)
    return fileIndex.length
  })

  ipcMain.handle('set-api-key', async (event, key) => {
    aiConfig.apiKey = key
    // 保存到配置文件
    const configPath = path.join(app.getPath('userData'), 'config.json')
    await fs.ensureDir(path.dirname(configPath))
    await fs.writeJson(configPath, aiConfig)
    return true
  })

  // 新增：保存完整AI配置
  ipcMain.handle('set-ai-config', async (event, config) => {
    aiConfig = { ...aiConfig, ...config }
    const configPath = path.join(app.getPath('userData'), 'config.json')
    await fs.ensureDir(path.dirname(configPath))
    await fs.writeJson(configPath, aiConfig)
    return true
  })

  // 新增：获取AI配置
  ipcMain.handle('get-ai-config', async () => {
    const configPath = path.join(app.getPath('userData'), 'config.json')
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath)
      aiConfig = { ...aiConfig, ...config }
      return aiConfig
    }
    return aiConfig
  })

  ipcMain.handle('find-duplicates', async (event, dirPath) => {
    return await findDuplicates(dirPath)
  })

  ipcMain.handle('delete-file', async (event, filePath) => {
    await fs.remove(filePath)
    return true
  })

  ipcMain.handle('get-processes', async () => {
    return await getProcessList()
  })

  ipcMain.handle('get-startup-apps', async () => {
    return await getStartupApps()
  })

  ipcMain.handle('show-context-menu', async (event, filePath) => {
    const template = [
      {
        label: 'AI智能重命名',
        click: async () => {
          try {
            const newName = await suggestFileName(filePath)
            mainWindow.webContents.send('ai-rename-result', { filePath, newName })
          } catch (error) {
            mainWindow.webContents.send('ai-rename-error', error.message)
          }
        }
      },
      { type: 'separator' },
      {
        label: '在文件夹中显示',
        click: () => {
          require('electron').shell.showItemInFolder(filePath)
        }
      },
      {
        label: '复制路径',
        click: () => {
          require('electron').clipboard.writeText(filePath)
        }
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    menu.popup(BrowserWindow.fromWebContents(event.sender))
  })

  ipcMain.handle('register-system-context-menu', async () => {
    try {
      const exePath = app.getPath('exe')
      registerContextMenu(exePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('unregister-system-context-menu', async () => {
    try {
      unregisterContextMenu()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 文件整理相关handlers
  ipcMain.handle('organize-scan', async (event, dirPath, useAI) => {
    return await organizeFiles(dirPath, useAI)
  })

  ipcMain.handle('organize-execute', async (event, operations) => {
    return await executeOrganize(operations)
  })

  ipcMain.handle('get-special-paths', async () => {
    return {
      desktop: app.getPath('desktop'),
      downloads: app.getPath('downloads'),
      documents: app.getPath('documents')
    }
  })

  // 选择文件夹对话框
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (result.canceled) {
      return null
    }
    return result.filePaths[0]
  })

  // 撤回整理操作
  ipcMain.handle('organize-undo', async () => {
    return await undoOrganize()
  })

  // 获取整理历史
  ipcMain.handle('organize-history', async () => {
    return getOrganizeHistory()
  })

  // 选择壁纸文件
  ipcMain.handle('select-wallpaper', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: '图片和视频', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'] }
      ]
    })
    if (result.canceled) {
      return null
    }
    return result.filePaths[0]
  })

  // 保存UI配置
  ipcMain.handle('set-ui-config', async (event, config) => {
    const configPath = path.join(app.getPath('userData'), 'ui-config.json')
    await fs.ensureDir(path.dirname(configPath))
    await fs.writeJson(configPath, config)
    return true
  })

  // 获取UI配置
  ipcMain.handle('get-ui-config', async () => {
    const configPath = path.join(app.getPath('userData'), 'ui-config.json')
    try {
      if (await fs.pathExists(configPath)) {
        return await fs.readJson(configPath)
      }
    } catch (error) {
      console.error('读取UI配置失败，使用默认配置:', error)
    }
    return {
      wallpaper: null,
      wallpaperType: 'image',
      uiOpacity: 0.95,
      cardOpacity: 0.9,
      blurAmount: 10
    }
  })

  // 读取壁纸文件为base64
  ipcMain.handle('get-wallpaper-data', async (event, filePath) => {
    try {
      const buffer = await fs.readFile(filePath)
      const base64 = buffer.toString('base64')
      const ext = path.extname(filePath).toLowerCase()

      let mimeType = 'image/jpeg'
      if (ext === '.png') mimeType = 'image/png'
      else if (ext === '.gif') mimeType = 'image/gif'
      else if (ext === '.webp') mimeType = 'image/webp'
      else if (ext === '.mp4') mimeType = 'video/mp4'
      else if (ext === '.webm') mimeType = 'video/webm'

      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error('读取壁纸文件失败:', error)
      return null
    }
  })

  // 多语言相关handlers
  ipcMain.handle('set-language', async (event, lang) => {
    const configPath = path.join(app.getPath('userData'), 'ui-config.json')
    let config = { language: 'en-US' }
    if (await fs.pathExists(configPath)) {
      config = await fs.readJson(configPath)
    }
    config.language = lang
    await fs.ensureDir(path.dirname(configPath))
    await fs.writeJson(configPath, config)
    return true
  })

  ipcMain.handle('get-language', async () => {
    const configPath = path.join(app.getPath('userData'), 'ui-config.json')
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath)
      return config.language || 'en-US'
    }
    return 'en-US'
  })
}
