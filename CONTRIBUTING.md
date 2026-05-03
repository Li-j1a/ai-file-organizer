# 贡献指南

感谢你对 AI 文件整理助手的关注！我们欢迎各种形式的贡献。

## 📋 贡献方式

### 报告 Bug

在提交 Bug 报告前，请先检查 [Issues](https://github.com/yourusername/AiAssistant/issues) 列表，确保该问题还未被报告。

提交 Bug 报告时，请包含以下信息：

- **清晰的标题和描述**
- **操作系统和版本**（Windows 10、macOS 12 等）
- **应用版本号**
- **详细的复现步骤**
- **实际行为和预期行为**
- **截图或错误日志**（如适用）

### 提交功能建议

功能建议也通过 [Issues](https://github.com/yourusername/AiAssistant/issues) 提交。请包含：

- **清晰的功能描述**
- **使用场景和价值**
- **可能的实现方案**（可选）

### 提交代码

1. **Fork 仓库**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **开启 Pull Request**

## 🔧 开发设置

### 环境要求
- Node.js 18+
- npm 或 yarn

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/AiAssistant.git
cd AiAssistant

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建应用
npm run build
```

## 📝 代码规范

### 命名规范
- **文件名**: 使用 kebab-case（如 `file-organizer.jsx`）
- **组件名**: 使用 PascalCase（如 `FileOrganizer`）
- **变量/函数**: 使用 camelCase（如 `handleFileSort`）
- **常量**: 使用 UPPER_SNAKE_CASE（如 `MAX_FILE_SIZE`）

### 代码风格
- 使用 2 空格缩进
- 使用分号结尾
- 使用单引号（字符串）
- 避免 console.log，使用适当的日志库

### 注释规范
- 只在必要时添加注释
- 注释应解释 WHY，而不是 WHAT
- 使用 JSDoc 格式注释函数

```javascript
/**
 * 分析文件内容并返回分类
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {Promise<string>} 分类结果
 */
async function analyzeFile(filePath, content) {
  // 实现
}
```

## ✅ Pull Request 流程

1. **更新 CHANGELOG.md** - 记录你的更改
2. **测试你的代码** - 确保没有破坏现有功能
3. **编写清晰的 PR 描述**
4. **等待审核** - 维护者会进行代码审查

### PR 描述模板

```markdown
## 描述
简要描述你的更改

## 相关 Issue
关闭 #123

## 更改类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 性能优化

## 测试
描述你的测试方法

## 检查清单
- [ ] 代码遵循项目风格
- [ ] 已更新相关文档
- [ ] 已添加必要的测试
- [ ] 所有测试通过
```

## 📚 文档

- 在 `README.md` 中更新功能文档
- 在 `CHANGELOG.md` 中记录更改
- 为复杂的代码添加注释

## 🎯 优先级

我们优先处理以下类型的贡献：

1. **安全修复** - 立即处理
2. **Bug 修复** - 高优先级
3. **性能优化** - 中优先级
4. **新功能** - 根据社区需求评估
5. **文档改进** - 欢迎随时提交

## 📞 联系方式

- 📧 Email: wswwciljk@gmail.com（李佳）
- 💬 GitHub Issues: 用于讨论和反馈

---

感谢你的贡献！🎉
