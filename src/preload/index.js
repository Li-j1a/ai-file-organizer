const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirectory: (dirPath) => ipcRenderer.invoke('scan-directory', dirPath),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  aiRenameFile: (filePath) => ipcRenderer.invoke('ai-rename-file', filePath),
  searchFiles: (query) => ipcRenderer.invoke('search-files', query),
  aiSearchFiles: (searchParams) => ipcRenderer.invoke('ai-search-files', searchParams),
  setApiKey: (key) => ipcRenderer.invoke('set-api-key', key),
  setAiConfig: (config) => ipcRenderer.invoke('set-ai-config', config),
  getAiConfig: () => ipcRenderer.invoke('get-ai-config'),
  findDuplicates: (dirPath) => ipcRenderer.invoke('find-duplicates', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  getStartupApps: () => ipcRenderer.invoke('get-startup-apps'),
  buildIndex: (dirPath) => ipcRenderer.invoke('build-index', dirPath),
  showContextMenu: (filePath) => ipcRenderer.invoke('show-context-menu', filePath),
  onAiRenameResult: (callback) => ipcRenderer.on('ai-rename-result', (event, data) => callback(data)),
  onAiRenameError: (callback) => ipcRenderer.on('ai-rename-error', (event, error) => callback(error)),
  registerSystemContextMenu: () => ipcRenderer.invoke('register-system-context-menu'),
  unregisterSystemContextMenu: () => ipcRenderer.invoke('unregister-system-context-menu'),
  // 文件整理相关
  organizeScan: (dirPath, useAI) => ipcRenderer.invoke('organize-scan', dirPath, useAI),
  organizeExecute: (operations) => ipcRenderer.invoke('organize-execute', operations),
  getSpecialPaths: () => ipcRenderer.invoke('get-special-paths'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  organizeUndo: () => ipcRenderer.invoke('organize-undo'),
  organizeHistory: () => ipcRenderer.invoke('organize-history'),
  // UI配置相关
  selectWallpaper: () => ipcRenderer.invoke('select-wallpaper'),
  setUiConfig: (config) => ipcRenderer.invoke('set-ui-config', config),
  getUiConfig: () => ipcRenderer.invoke('get-ui-config'),
  getWallpaperData: (filePath) => ipcRenderer.invoke('get-wallpaper-data', filePath),
  // 免责声明相关
  checkDisclaimerAgreed: () => ipcRenderer.invoke('check-disclaimer-agreed'),
  saveDisclaimerAgreed: () => ipcRenderer.invoke('save-disclaimer-agreed'),
  // 多语言相关
  setLanguage: (lang) => ipcRenderer.invoke('set-language', lang),
  getLanguage: () => ipcRenderer.invoke('get-language')
})
