import React, { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  FolderOutlined,
  SearchOutlined,
  ToolOutlined,
  SettingOutlined,
  FolderOpenOutlined
} from '@ant-design/icons'
import { t } from './locales'
import Dashboard from './pages/Dashboard'
import FileManager from './pages/FileManager'
import SmartSearch from './pages/SmartSearch'
import SystemOptimizer from './pages/SystemOptimizer'
import Settings from './pages/Settings'
import FileOrganizer from './pages/FileOrganizer'
import WallpaperBackground from './components/WallpaperBackground'
import DisclaimerModal from './components/DisclaimerModal'

const { Sider, Content } = Layout

function AppContent() {
  const location = useLocation()
  const [language, setLanguage] = useState('en-US')
  const [uiConfig, setUiConfig] = useState({
    uiOpacity: 0.95,
    cardOpacity: 0.9,
    blurAmount: 10
  })
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)

  useEffect(() => {
    loadLanguage()
    checkDisclaimer()
    loadUiConfig()
    window.addEventListener('ui-config-updated', loadUiConfig)
    return () => window.removeEventListener('ui-config-updated', loadUiConfig)
  }, [])

  const loadLanguage = async () => {
    const lang = await window.electronAPI.getLanguage()
    setLanguage(lang)
  }

  const checkDisclaimer = async () => {
    const agreed = await window.electronAPI.checkDisclaimerAgreed()
    setDisclaimerChecked(true)
    if (!agreed) {
      setShowDisclaimer(true)
    }
  }

  const handleDisclaimerAccept = async () => {
    await window.electronAPI.saveDisclaimerAgreed()
    setShowDisclaimer(false)
  }

  const handleDisclaimerReject = () => {
    window.close()
  }

  const loadUiConfig = async () => {
    const config = await window.electronAPI.getUiConfig()
    setUiConfig(config)
  }

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t(language, 'menu.dashboard') },
    { key: '/files', icon: <FolderOutlined />, label: t(language, 'menu.fileManager') },
    { key: '/organizer', icon: <FolderOpenOutlined />, label: t(language, 'menu.fileOrganizer') },
    { key: '/search', icon: <SearchOutlined />, label: t(language, 'menu.smartSearch') },
    { key: '/optimizer', icon: <ToolOutlined />, label: t(language, 'menu.systemOptimizer') },
    { key: '/settings', icon: <SettingOutlined />, label: t(language, 'menu.settings') }
  ]

  // 在免责声明未确认前不显示主界面
  if (!disclaimerChecked) {
    return null
  }

  return (
    <>
      <DisclaimerModal
        visible={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onReject={handleDisclaimerReject}
      />
      <WallpaperBackground />
      <Layout style={{
        height: '100vh',
        background: 'transparent'
      }}>
        <Sider
          width={240}
          style={{
            background: `rgba(255, 255, 255, ${uiConfig.uiOpacity})`,
            backdropFilter: `blur(${uiConfig.blurAmount}px)`,
            WebkitBackdropFilter: `blur(${uiConfig.blurAmount}px)`,
            borderRight: '1px solid rgba(229, 229, 229, 0.5)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{
            padding: '24px 20px',
            fontSize: '20px',
            fontWeight: '600',
            color: '#2c2c2c',
            borderBottom: '1px solid #e5e5e5'
          }}>
            {t(language, 'app.title')}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{
              border: 'none',
              background: 'transparent',
              marginTop: '8px'
            }}
            items={menuItems.map(item => ({
              ...item,
              label: <Link to={item.key} style={{
                color: location.pathname === item.key ? '#2c2c2c' : '#666',
                fontWeight: location.pathname === item.key ? '500' : '400'
              }}>{item.label}</Link>,
              style: {
                margin: '4px 8px',
                borderRadius: '8px',
                height: '40px',
                lineHeight: '40px'
              }
            }))}
          />
        </div>
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(229, 229, 229, 0.5)',
          fontSize: '11px',
          color: '#666',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>by 李佳</div>
          <div style={{ marginBottom: '4px' }}>wswwciljk@gmail.com</div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            {t(language, 'app.suggestion')}
          </div>
        </div>
      </Sider>
      <Content style={{
        padding: '32px',
        overflow: 'auto',
        background: 'transparent'
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/files" element={<FileManager />} />
          <Route path="/organizer" element={<FileOrganizer />} />
          <Route path="/search" element={<SmartSearch />} />
          <Route path="/optimizer" element={<SystemOptimizer />} />
          <Route path="/settings" element={<Settings uiConfig={uiConfig} />} />
        </Routes>
      </Content>
    </Layout>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
