const translations = {
  'en-US': {
    menu: {
      dashboard: 'Dashboard',
      fileManager: 'File Manager',
      fileOrganizer: 'File Organizer',
      smartSearch: 'Smart Search',
      systemOptimizer: 'System Optimizer',
      settings: 'Settings'
    },
    app: {
      title: 'AI File Organizer',
      suggestion: 'For suggestions, please contact the developer via email'
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      languageChanged: 'Language changed successfully',
      aiConfig: 'AI Model Configuration',
      selectProvider: 'Select AI Service Provider',
      apiKey: 'API Key',
      enterApiKey: 'Enter your API key',
      modelName: 'Model Name',
      enterModel: 'e.g: gpt-4o-mini',
      apiUrl: 'API URL',
      enterApiUrl: 'https://api.openai.com/v1',
      saveConfig: 'Save Configuration',
      saved: 'Saved',
      systemIntegration: 'System Integration',
      contextMenu: 'Windows Context Menu Integration',
      contextMenuDesc: 'After registration, you can right-click on any file on the desktop and select "AI Smart Rename"',
      register: 'Register to System Context Menu',
      unregister: 'Unregister System Context Menu',
      notes: 'Notes',
      adminRequired: 'Administrator privileges required to modify registry',
      configRequired: 'API key must be configured before use',
      uninstallFirst: 'Please unregister context menu before uninstalling',
      appearance: 'Appearance Settings',
      wallpaper: 'Background Wallpaper',
      selectWallpaper: 'Select Wallpaper (Image/Video)',
      removeWallpaper: 'Remove Wallpaper',
      currentWallpaper: 'Current Wallpaper:',
      sidebarOpacity: 'Sidebar Opacity',
      cardOpacity: 'Card Opacity',
      blurAmount: 'Background Blur'
    }
  },
  'zh-CN': {
    menu: {
      dashboard: '仪表盘',
      fileManager: '文件管理',
      fileOrganizer: '文件整理',
      smartSearch: '智能搜索',
      systemOptimizer: '系统优化',
      settings: '设置'
    },
    app: {
      title: 'AI文件整理',
      suggestion: '如有改进建议，欢迎通过邮箱联系开发者'
    },
    settings: {
      title: '设置',
      language: '语言',
      languageChanged: '语言已切换',
      aiConfig: 'AI 模型配置',
      selectProvider: '选择AI服务提供商',
      apiKey: 'API密钥',
      enterApiKey: '输入你的API密钥',
      modelName: '模型名称',
      enterModel: '例如: gpt-4o-mini',
      apiUrl: 'API地址',
      enterApiUrl: 'https://api.openai.com/v1',
      saveConfig: '保存配置',
      saved: '已保存',
      systemIntegration: '系统集成',
      contextMenu: 'Windows右键菜单集成',
      contextMenuDesc: '注册后，可以在桌面任意文件上右键，选择"AI智能重命名"功能',
      register: '注册到系统右键菜单',
      unregister: '卸载系统右键菜单',
      notes: '注意事项',
      adminRequired: '需要管理员权限才能修改注册表',
      configRequired: '注册后需要先配置API密钥才能使用',
      uninstallFirst: '卸载应用前请先卸载右键菜单',
      appearance: '界面外观设置',
      wallpaper: '背景壁纸',
      selectWallpaper: '选择壁纸（图片/视频）',
      removeWallpaper: '移除壁纸',
      currentWallpaper: '当前壁纸：',
      sidebarOpacity: '侧边栏透明度',
      cardOpacity: '卡片透明度',
      blurAmount: '背景模糊度'
    }
  }
}

export const t = (lang, key) => {
  const keys = key.split('.')
  let value = translations[lang]
  for (const k of keys) {
    value = value?.[k]
  }
  return value || key
}
