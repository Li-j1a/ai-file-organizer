# AI 文件整理助手

<div align="center">

![Electron](https://img.shields.io/badge/Electron-29.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

一个智能的桌面文件管理工具，集成AI能力，帮助用户快速整理和管理文件。

[功能特性](#功能特性) • [快速开始](#快速开始) • [使用指南](#使用指南) • [开发](#开发) • [许可证](#许可证)

</div>

---

## 📋 功能特性

### 🤖 AI 智能功能
- **智能文件分类** - 利用AI分析文件内容，自动分类到合适的文件夹
- **语义搜索** - 支持自然语言搜索，快速定位所需文件
- **智能重命名** - AI建议更有意义的文件名称
- **内容分析** - 支持多种文件格式的内容提取和分析

### 📁 文件管理
- **快速扫描** - 快速扫描桌面和下载文件夹
- **多维度筛选** - 按文件类型、修改时间、创建时间等多维度筛选
- **批量操作** - 支持批量移动、删除、重命名等操作
- **文件预览** - 支持常见文件格式的预览

### ⚙️ 系统特性
- **离线模式** - 支持离线使用本地功能
- **多AI提供商** - 支持OpenAI、Claude、Gemini等多个AI服务
- **自定义配置** - 灵活的UI和功能配置选项
- **数据安全** - 所有数据处理均在本地完成，不上传用户文件

---

## 🚀 快速开始

### 系统要求
- **操作系统**: Windows 10+ / macOS 10.13+ / Linux
- **Node.js**: 18.0 或更高版本
- **内存**: 最少 2GB RAM
- **磁盘空间**: 最少 500MB

### 安装

#### 方式一：使用预编译版本
从 [Releases](https://github.com/yourusername/AiAssistant/releases) 页面下载最新版本的安装程序。

#### 方式二：从源代码构建

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/AiAssistant.git
cd AiAssistant
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **构建应用**
```bash
npm run build
```

---

## 📖 使用指南

### 基础操作

#### 1. 文件扫描
- 点击侧边栏的"文件整理"菜单
- 选择要扫描的文件夹（桌面/下载/文档）
- 点击"开始扫描"按钮

#### 2. 文件分类
- **基础分类**: 系统自动按文件类型分类
- **AI智能分类**: 启用"AI智能分类"选项，获得更精准的分类建议
- **自定义分类**: 手动调整文件的分类

#### 3. 执行整理
- 在预览窗口确认文件分类结果
- 点击"开始整理"按钮执行文件移动
- 文件将被移动到对应的分类文件夹

#### 4. 智能搜索
- 在搜索框输入关键词或自然语言描述
- 支持按文件类型、时间范围等条件筛选
- 启用AI搜索获得更智能的搜索结果

### 配置选项

#### AI 提供商配置
在设置中配置你的AI服务：

```json
{
  "aiProvider": "openai",
  "apiKey": "your-api-key",
  "model": "gpt-4",
  "timeout": 60000
}
```

支持的提供商：
- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Claude** - Claude 3 系列
- **Google Gemini** - Gemini Pro
- **本地模型** - 支持本地部署的模型

#### UI 配置
- **主题色** - 自定义应用主题
- **透明度** - 调整窗口透明度
- **模糊效果** - 启用/禁用背景模糊

---

## 🛠️ 开发

### 项目结构
```
AiAssistant/
├── src/
│   ├── main/              # Electron 主进程
│   │   └── index.js       # 主进程入口
│   ├── preload/           # Preload 脚本
│   │   └── index.js       # IPC 接口定义
│   └── renderer/          # React 渲染进程
│       └── src/
│           ├── App.jsx    # 主应用组件
│           ├── pages/     # 页面组件
│           └── components/# 可复用组件
├── public/                # 静态资源
├── dist/                  # 构建输出
└── package.json           # 项目配置
```

### 核心技术栈
- **Electron** - 跨平台桌面应用框架
- **React 18** - UI 框架
- **Ant Design** - UI 组件库
- **Vite** - 构建工具
- **fs-extra** - 文件系统操作
- **axios** - HTTP 客户端

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建应用
npm run build

# 打包应用
npm run package

# 运行测试
npm run test

# 代码检查
npm run lint
```

### IPC 通信

应用使用 Electron IPC 进行主进程和渲染进程通信。主要接口：

```javascript
// 文件操作
window.electronAPI.scanDirectory(path)
window.electronAPI.organizeFiles(dirPath, useAI)
window.electronAPI.executeOrganize(operations)

// AI 功能
window.electronAPI.callAI(prompt)
window.electronAPI.analyzeFile(filePath)

// 系统
window.electronAPI.getSpecialPaths()
window.electronAPI.checkDisclaimerAgreed()
```

### 添加新功能

1. **在主进程中实现逻辑** (`src/main/index.js`)
2. **注册 IPC Handler**
```javascript
ipcMain.handle('feature-name', async (event, params) => {
  // 实现逻辑
})
```

3. **在 Preload 中暴露接口** (`src/preload/index.js`)
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  featureName: (params) => ipcRenderer.invoke('feature-name', params)
})
```

4. **在渲染进程中使用**
```javascript
const result = await window.electronAPI.featureName(params)
```

---

## ⚠️ 免责声明

- 本软件按"现状"提供，开发者不提供任何形式的担保
- 用户在使用本软件时自主操作的一切内容，以及因此产生的任何风险（如文件丢失、误删除等），均由用户自行承担
- 启用AI功能时，AI生成的内容来自第三方服务，用户应自行甄别信息的准确性
- 详见应用首次启动时的完整用户协议

---

## 📦 依赖项

### 主要依赖
- electron: ^29.0.0
- react: ^18.2.0
- react-dom: ^18.2.0
- antd: ^5.12.0
- axios: ^1.6.0
- fs-extra: ^11.2.0

### 开发依赖
- vite: ^5.0.0
- @vitejs/plugin-react: ^4.2.0
- electron-builder: ^24.6.0

完整依赖列表见 `package.json`

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 报告问题
- 使用 [GitHub Issues](https://github.com/yourusername/AiAssistant/issues) 报告 Bug
- 提供详细的复现步骤和环境信息

### 提交改进建议
- 邮箱: wswwciljk@gmail.com
- 描述你的想法和改进建议

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

### 开源项目致谢
本项目使用了以下优秀的开源项目：
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Ant Design](https://ant.design/)
- [Vite](https://vitejs.dev/)

---

## 👨‍💻 开发者

**李佳**
- 📧 Email: wswwciljk@gmail.com
- 💬 如有改进建议，欢迎通过邮箱联系开发者

---

## 📊 项目统计

- 📝 代码行数: 5000+
- 📦 依赖包数: 100+
- 🔧 支持平台: Windows, macOS, Linux
- 🌍 支持语言: 中文, English (计划中)

---

<div align="center">

**[⬆ 返回顶部](#ai-文件整理助手)**

Made with ❤️ by 李佳

</div>
