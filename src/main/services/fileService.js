const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')

class FileService {
  async scanDirectory(dirPath) {
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

  async findDuplicates(dirPath) {
    const files = await this.scanDirectory(dirPath)
    const hashMap = new Map()

    for (const file of files) {
      const hash = await this.getFileHash(file.path)
      if (!hashMap.has(hash)) {
        hashMap.set(hash, [])
      }
      hashMap.get(hash).push(file)
    }

    return Array.from(hashMap.values()).filter(group => group.length > 1)
  }

  async getFileHash(filePath) {
    const buffer = await fs.readFile(filePath)
    return crypto.createHash('md5').update(buffer).digest('hex')
  }

  async searchFiles(query) {
    // 简单的文件名搜索，后续可集成全文搜索
    return []
  }
}

module.exports = new FileService()
