import React, { useEffect, useState } from 'react'

export default function WallpaperBackground() {
  const [config, setConfig] = useState(null)
  const [wallpaperData, setWallpaperData] = useState(null)

  useEffect(() => {
    loadConfig()
    // 监听配置更新
    window.addEventListener('ui-config-updated', loadConfig)
    return () => window.removeEventListener('ui-config-updated', loadConfig)
  }, [])

  const loadConfig = async () => {
    try {
      const uiConfig = await window.electronAPI.getUiConfig()
      setConfig(uiConfig)

      // 如果有壁纸，加载壁纸数据
      if (uiConfig.wallpaper) {
        const data = await window.electronAPI.getWallpaperData(uiConfig.wallpaper)
        setWallpaperData(data)
      } else {
        setWallpaperData(null)
      }
    } catch (error) {
      console.error('加载UI配置失败:', error)
    }
  }

  if (!config || !wallpaperData) {
    return null
  }

  const isVideo = config.wallpaperType === 'video'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      overflow: 'hidden'
    }}>
      {isVideo ? (
        <video
          src={wallpaperData}
          autoPlay
          loop
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `blur(${config.blurAmount}px)`
          }}
          onError={(e) => console.error('视频加载失败:', e)}
        />
      ) : (
        <img
          src={wallpaperData}
          alt="wallpaper"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `blur(${config.blurAmount}px)`
          }}
          onError={(e) => console.error('图片加载失败:', e)}
        />
      )}
    </div>
  )
}
