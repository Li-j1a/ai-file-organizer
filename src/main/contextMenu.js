const { exec } = require('child_process')
const path = require('path')

// 注册Windows右键菜单
function registerContextMenu(appPath) {
  const regKey = 'HKEY_CLASSES_ROOT\\*\\shell\\AIRename'
  const command = `"${appPath}" --ai-rename "%1"`

  const regCommands = [
    `reg add "${regKey}" /ve /d "AI智能重命名" /f`,
    `reg add "${regKey}" /v "Icon" /d "${appPath}" /f`,
    `reg add "${regKey}\\command" /ve /d "${command}" /f`
  ]

  regCommands.forEach(cmd => {
    exec(cmd, (error) => {
      if (error) {
        console.error('注册右键菜单失败:', error)
      }
    })
  })
}

// 卸载Windows右键菜单
function unregisterContextMenu() {
  const regKey = 'HKEY_CLASSES_ROOT\\*\\shell\\AIRename'
  exec(`reg delete "${regKey}" /f`, (error) => {
    if (error) {
      console.error('卸载右键菜单失败:', error)
    }
  })
}

module.exports = {
  registerContextMenu,
  unregisterContextMenu
}
