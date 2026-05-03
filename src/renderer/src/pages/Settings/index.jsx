import React, { useState, useEffect } from 'react'
import { Card, Input, Button, message, Space, Alert, Divider, Select, Form, Slider, Upload } from 'antd'
import { KeyOutlined, CheckCircleOutlined, WindowsOutlined, ApiOutlined, BgColorsOutlined, PictureOutlined } from '@ant-design/icons'
import { t } from '../../locales'

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI (GPT-4/GPT-3.5)', defaultModel: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
  { value: 'claude', label: 'Anthropic Claude 官方', defaultModel: 'claude-sonnet-4-6', baseUrl: 'https://api.anthropic.com/v1' },
  { value: 'qwen', label: '阿里通义千问', defaultModel: 'qwen-turbo', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { value: 'ernie', label: '百度文心一言', defaultModel: 'ernie-4.0-turbo-8k', baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1' },
  { value: 'zhipu', label: '智谱AI (GLM-4)', defaultModel: 'glm-4-flash', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { value: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' },
  { value: 'kimi', label: '月之暗面 Kimi', defaultModel: 'moonshot-v1-8k', baseUrl: 'https://api.moonshot.cn/v1' },
  { value: 'custom', label: '自定义 (兼容OpenAI格式)', defaultModel: 'gpt-3.5-turbo', baseUrl: '' }
]

export default function Settings({ uiConfig: initialUiConfig }) {
  const [form] = Form.useForm()
  const [provider, setProvider] = useState('openai')
  const [saved, setSaved] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [language, setLanguage] = useState('en-US')
  const [uiConfig, setUiConfig] = useState({
    wallpaper: null,
    wallpaperType: 'image',
    uiOpacity: 0.95,
    cardOpacity: 0.9,
    blurAmount: 10
  })

  useEffect(() => {
    loadLanguage()
    loadConfig()
    loadUiConfig()
  }, [])

  const loadLanguage = async () => {
    const lang = await window.electronAPI.getLanguage()
    setLanguage(lang)
  }

  const handleLanguageChange = async (lang) => {
    setLanguage(lang)
    await window.electronAPI.setLanguage(lang)
    message.success(t(lang, 'settings.languageChanged'))
    setTimeout(() => window.location.reload(), 500)
  }

  const loadUiConfig = async () => {
    try {
      const config = await window.electronAPI.getUiConfig()
      setUiConfig(config)
      // 设置CSS变量
      document.documentElement.style.setProperty('--card-opacity', config.cardOpacity)
      document.documentElement.style.setProperty('--blur-amount', `${config.blurAmount}px`)
    } catch (error) {
      console.error('加载UI配置失败:', error)
    }
  }

  const loadConfig = async () => {
      try {
        const config = await window.electronAPI.getAiConfig()
        if (config) {
          setProvider(config.provider || 'openai')
          form.setFieldsValue(config)
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    }

  const handleProviderChange = (value) => {
    setProvider(value)
    const providerInfo = AI_PROVIDERS.find(p => p.value === value)
    if (providerInfo) {
      form.setFieldsValue({
        model: providerInfo.defaultModel,
        baseUrl: providerInfo.baseUrl
      })
    }
    setSaved(false)
  }

  const saveConfig = async () => {
    try {
      const values = await form.validateFields()
      const config = {
        provider,
        ...values
      }
      await window.electronAPI.setAiConfig(config)
      setSaved(true)
      message.success('AI配置已保存')
    } catch (error) {
      message.error('保存失败：' + error.message)
    }
  }

  const registerContextMenu = async () => {
    setRegistering(true)
    try {
      const result = await window.electronAPI.registerSystemContextMenu()
      if (result.success) {
        message.success('系统右键菜单已注册！现在可以在桌面任意文件上右键使用AI重命名')
      } else {
        message.error('注册失败：' + result.error)
      }
    } catch (error) {
      message.error('注册失败：' + error.message)
    } finally {
      setRegistering(false)
    }
  }

  const unregisterContextMenu = async () => {
    setRegistering(true)
    try {
      const result = await window.electronAPI.unregisterSystemContextMenu()
      if (result.success) {
        message.success('系统右键菜单已卸载')
      } else {
        message.error('卸载失败：' + result.error)
      }
    } catch (error) {
      message.error('卸载失败：' + error.message)
    } finally {
      setRegistering(false)
    }
  }

  const getProviderHelp = () => {
    const helps = {
      openai: '访问 platform.openai.com 获取API密钥',
      claude: '访问 console.anthropic.com 获取官方API密钥',
      qwen: '访问 dashscope.aliyun.com 获取API密钥',
      ernie: '访问 cloud.baidu.com 获取API密钥和Secret Key',
      zhipu: '访问 open.bigmodel.cn 获取API密钥',
      deepseek: '访问 platform.deepseek.com 获取API密钥',
      kimi: '访问 platform.moonshot.cn 获取API密钥',
      custom: '输入兼容OpenAI格式的API地址和密钥'
    }
    return helps[provider] || ''
  }

  const handleSelectWallpaper = async () => {
    try {
      const filePath = await window.electronAPI.selectWallpaper()
      if (filePath) {
        const ext = filePath.toLowerCase()
        const isVideo = ext.endsWith('.mp4') || ext.endsWith('.webm')
        const newConfig = {
          ...uiConfig,
          wallpaper: filePath,
          wallpaperType: isVideo ? 'video' : 'image'
        }
        await window.electronAPI.setUiConfig(newConfig)
        setUiConfig(newConfig)
        window.dispatchEvent(new Event('ui-config-updated'))
        message.success('壁纸已设置')
      }
    } catch (error) {
      message.error('设置壁纸失败：' + error.message)
    }
  }

  const handleRemoveWallpaper = async () => {
    try {
      const newConfig = { ...uiConfig, wallpaper: null }
      await window.electronAPI.setUiConfig(newConfig)
      setUiConfig(newConfig)
      window.dispatchEvent(new Event('ui-config-updated'))
      message.success('壁纸已移除')
    } catch (error) {
      message.error('移除壁纸失败：' + error.message)
    }
  }

  const handleUiConfigChange = async (key, value) => {
    const newConfig = { ...uiConfig, [key]: value }
    setUiConfig(newConfig)
    await window.electronAPI.setUiConfig(newConfig)

    // 更新CSS变量
    if (key === 'cardOpacity') {
      document.documentElement.style.setProperty('--card-opacity', value)
    } else if (key === 'blurAmount') {
      document.documentElement.style.setProperty('--blur-amount', `${value}px`)
    }

    window.dispatchEvent(new Event('ui-config-updated'))
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t(language, 'settings.title')}</h1>

      <Card title={<><ApiOutlined /> {t(language, 'settings.aiConfig')}</>} style={{ maxWidth: 800 }}>
        <Alert
          message={t(language, 'settings.selectProvider')}
          description={getProviderHelp()}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item label={t(language, 'settings.selectProvider')} name="provider">
            <Select
              value={provider}
              onChange={handleProviderChange}
              options={AI_PROVIDERS}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label={t(language, 'settings.apiKey')}
            name="apiKey"
            rules={[{ required: true, message: t(language, 'settings.enterApiKey') }]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder={t(language, 'settings.enterApiKey')}
            />
          </Form.Item>

          <Form.Item
            label={t(language, 'settings.modelName')}
            name="model"
            rules={[{ required: true, message: t(language, 'settings.enterModel') }]}
          >
            <Input placeholder={t(language, 'settings.enterModel')} />
          </Form.Item>

          <Form.Item
            label={t(language, 'settings.apiUrl')}
            name="baseUrl"
            rules={[{ required: true, message: t(language, 'settings.enterApiUrl') }]}
          >
            <Input placeholder={t(language, 'settings.enterApiUrl')} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              onClick={saveConfig}
              icon={saved ? <CheckCircleOutlined /> : null}
              block
            >
              {saved ? t(language, 'settings.saved') : t(language, 'settings.saveConfig')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title={t(language, 'settings.systemIntegration')} style={{ maxWidth: 800, marginTop: 16 }}>
        <Alert
          message={t(language, 'settings.contextMenu')}
          description={t(language, 'settings.contextMenuDesc')}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Space>
          <Button
            type="primary"
            icon={<WindowsOutlined />}
            onClick={registerContextMenu}
            loading={registering}
          >
            {t(language, 'settings.register')}
          </Button>

          <Button
            danger
            onClick={unregisterContextMenu}
            loading={registering}
          >
            {t(language, 'settings.unregister')}
          </Button>
        </Space>

        <Divider />

        <Alert
          message={t(language, 'settings.notes')}
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>{t(language, 'settings.adminRequired')}</li>
              <li>{t(language, 'settings.configRequired')}</li>
              <li>{t(language, 'settings.uninstallFirst')}</li>
            </ul>
          }
          type="info"
        />
      </Card>

      <Card
        title={<><BgColorsOutlined /> {t(language, 'settings.appearance')}</>}
        style={{ maxWidth: 800, marginTop: 24 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <h4 style={{ marginBottom: 12 }}>
              <PictureOutlined /> {t(language, 'settings.wallpaper')}
            </h4>
            <Space>
              <Button onClick={handleSelectWallpaper}>
                {t(language, 'settings.selectWallpaper')}
              </Button>
              {uiConfig.wallpaper && (
                <Button danger onClick={handleRemoveWallpaper}>
                  {t(language, 'settings.removeWallpaper')}
                </Button>
              )}
            </Space>
            {uiConfig.wallpaper && (
              <div style={{
                marginTop: 12,
                padding: 8,
                background: '#f5f5f5',
                borderRadius: 6,
                fontSize: 12,
                color: '#666'
              }}>
                {t(language, 'settings.currentWallpaper')}{uiConfig.wallpaper}
              </div>
            )}
          </div>

          <Divider />

          <div>
            <h4>{t(language, 'settings.sidebarOpacity')}</h4>
            <Slider
              min={0.5}
              max={1}
              step={0.05}
              value={uiConfig.uiOpacity}
              onChange={(value) => handleUiConfigChange('uiOpacity', value)}
              marks={{
                0.5: '50%',
                0.75: '75%',
                1: '100%'
              }}
            />
          </div>

          <div>
            <h4>{t(language, 'settings.cardOpacity')}</h4>
            <Slider
              min={0.5}
              max={1}
              step={0.05}
              value={uiConfig.cardOpacity}
              onChange={(value) => handleUiConfigChange('cardOpacity', value)}
              marks={{
                0.5: '50%',
                0.75: '75%',
                1: '100%'
              }}
            />
          </div>

          <div>
            <h4>{t(language, 'settings.blurAmount')}</h4>
            <Slider
              min={0}
              max={30}
              step={1}
              value={uiConfig.blurAmount}
              onChange={(value) => handleUiConfigChange('blurAmount', value)}
              marks={{
                0: '无',
                10: '中',
                20: '高',
                30: '极高'
              }}
            />
          </div>

          <Divider />

          <div>
            <h4>{t(language, 'settings.language')}</h4>
            <Select
              value={language}
              onChange={handleLanguageChange}
              options={[
                { value: 'en-US', label: 'English' },
                { value: 'zh-CN', label: '中文' }
              ]}
              style={{ width: 200 }}
            />
          </div>
        </Space>
      </Card>
    </div>
  )
}
