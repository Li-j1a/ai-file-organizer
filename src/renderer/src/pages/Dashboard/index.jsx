import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Progress, Statistic } from 'antd'
import {
  HddOutlined,
  ThunderboltOutlined,
  DatabaseOutlined
} from '@ant-design/icons'

export default function Dashboard() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSystemInfo()
  }, [])

  const loadSystemInfo = async () => {
    try {
      const info = await window.electronAPI.getSystemInfo()
      setSystemInfo(info)
    } catch (error) {
      console.error('获取系统信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>

  const memoryUsage = systemInfo ?
    Math.round((systemInfo.memory.used / systemInfo.memory.total) * 100) : 0

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>系统概览</h1>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="CPU"
              value={systemInfo?.cpu.model}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ fontSize: 14 }}
            />
            <div style={{ marginTop: 8, color: '#666' }}>
              {systemInfo?.cpu.cores} 核心 @ {systemInfo?.cpu.speed} GHz
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="内存使用"
              value={memoryUsage}
              suffix="%"
              prefix={<DatabaseOutlined />}
            />
            <Progress percent={memoryUsage} status="active" />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="磁盘"
              value={systemInfo?.disk.length || 0}
              suffix="个分区"
              prefix={<HddOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="磁盘空间" style={{ marginTop: 16 }}>
        {systemInfo?.disk.map((d, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              {d.fs} - {(d.size / 1024 / 1024 / 1024).toFixed(1)} GB
            </div>
            <Progress percent={d.use} />
          </div>
        ))}
      </Card>
    </div>
  )
}
