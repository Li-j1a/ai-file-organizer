import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Progress, Tabs, message } from 'antd'
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'

export default function SystemOptimizer() {
  const [processes, setProcesses] = useState([])
  const [startupApps, setStartupApps] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProcesses()
  }, [])

  const loadProcesses = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.getProcesses()
      setProcesses(result)
    } catch (error) {
      message.error('获取进程列表失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadStartupApps = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.getStartupApps()
      setStartupApps(result)
    } catch (error) {
      message.error('获取启动项失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const processColumns = [
    { title: 'PID', dataIndex: 'pid', key: 'pid', width: 80 },
    { title: '进程名', dataIndex: 'name', key: 'name' },
    {
      title: 'CPU使用率',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (cpu) => `${cpu.toFixed(1)}%`,
      sorter: (a, b) => a.cpu - b.cpu
    },
    {
      title: '内存占用',
      dataIndex: 'memory',
      key: 'memory',
      render: (mem) => `${(mem / 1024 / 1024).toFixed(1)} MB`,
      sorter: (a, b) => a.memory - b.memory
    }
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>系统优化</h1>

      <Tabs
        items={[
          {
            key: '1',
            label: '进程管理',
            children: (
              <Card
                extra={
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadProcesses}
                    loading={loading}
                  >
                    刷新
                  </Button>
                }
              >
                <Table
                  columns={processColumns}
                  dataSource={processes}
                  rowKey="pid"
                  loading={loading}
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            )
          },
          {
            key: '2',
            label: '启动项管理',
            children: (
              <Card
                extra={
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadStartupApps}
                    loading={loading}
                  >
                    刷新
                  </Button>
                }
              >
                {startupApps.length === 0 ? (
                  <p>暂无启动项数据（需要管理员权限读取注册表）</p>
                ) : (
                  <Table
                    dataSource={startupApps}
                    rowKey="name"
                    loading={loading}
                  />
                )}
              </Card>
            )
          }
        ]}
      />
    </div>
  )
}

