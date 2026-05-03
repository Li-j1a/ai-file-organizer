const axios = require('axios')

class AIService {
  constructor() {
    this.apiKey = null
  }

  setApiKey(key) {
    this.apiKey = key
  }

  async suggestFileName(filePath) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置Claude API密钥')
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `为这个文件建议一个清晰的中文文件名：${filePath}`
          }]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      )

      return response.data.content[0].text
    } catch (error) {
      throw new Error('AI服务调用失败：' + error.message)
    }
  }
}

module.exports = new AIService()
