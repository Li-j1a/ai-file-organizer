import React, { useState, useEffect } from 'react'
import { Button, Table, message, Input, Space, Tabs, Card, Popconfirm, Tag } from 'antd'
import { FolderOpenOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'

export default function FileManager() {
  const [files, setFiles] = useState([])
  const [duplicates, setDuplicates] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPath, setSelectedPath] = useState('')

  useEffect(() => {
    // 监听AI重命名结果
    window.electronAPI.onAiRenameResult((data) => {
      message.success(`AI建议的文件名：${data.newName}`)
    })

    window.electronAPI.onAiRenameError((error) => {
      message.error(`AI重命名失败：${error}`)
    })
  }, [])

  const scanDirectory = async () => {
    if (!selectedPath) {
      message.warning('请输入文件夹路径')
      return
    }

    setLoading(true)
    try {
      const result = await window.electronAPI.scanDirectory(selectedPath)
      setFiles(result)
      message.success(`扫描完成，找到 ${result.length} 个文件`)
    } catch (error) {
      message.error('扫描失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const findDuplicates = async () => {
    if (!selectedPath) {
      message.warning('请输入文件夹路径')
      return
    }

    setLoading(true)
    try {
      const result = await window.electronAPI.findDuplicates(selectedPath)
      setDuplicates(result)
      const totalDuplicates = result.reduce((sum, group) => sum + group.length, 0)
      message.success(`找到 ${result.length} 组重复文件，共 ${totalDuplicates} 个文件`)
    } catch (error) {
      message.error('检测失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (filePath) => {
    try {
      await window.electronAPI.deleteFile(filePath)
      message.success('文件已删除')
      findDuplicates()
    } catch (error) {
      message.error('删除失败：' + error.message)
    }
  }

  const aiRename = async (filePath) => {
    try {
      const newName = await window.electronAPI.aiRenameFile(filePath)
      message.success(`AI建议的文件名：${newName}`)
    } catch (error) {
      message.error('AI重命名失败：' + error.message)
    }
  }

  const showContextMenu = (filePath) => {
    window.electronAPI.showContextMenu(filePath)
  }

  const fileColumns = [
    { title: '文件名', dataIndex: 'name', key: 'name', width: 300 },
    { title: '大小', dataIndex: 'size', key: 'size',
      render: (size) => (size / 1024).toFixed(2) + ' KB' },
    { title: '类型', dataIndex: 'ext', key: 'ext' },
    { title: '修改时间', dataIndex: 'modified', key: 'modified',
      render: (date) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => aiRename(record.path)}
          size="small"
        >
          AI重命名
        </Button>
      )
    }
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>文件管理</h1>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="输入文件夹路径，如：G:\\"
          style={{ width: 400 }}
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
        />
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={scanDirectory}
          loading={loading}
        >
          扫描文件夹
        </Button>
        <Button
          icon={<SearchOutlined />}
          onClick={findDuplicates}
          loading={loading}
        >
          查找重复文件
        </Button>
      </Space>

      <Tabs
        items={[
          {
            key: '1',
            label: '文件列表',
            children: (
              <Table
                columns={fileColumns}
                dataSource={files}
                rowKey="path"
                loading={loading}
                onRow={(record) => ({
                  onContextMenu: (e) => {
                    e.preventDefault()
                    showContextMenu(record.path)
                  }
                })}
              />
            )
          },
          {
            key: '2',
            label: `重复文件 (${duplicates.length}组)`,
            children: (
              <div>
                {duplicates.length === 0 ? (
                  <Card>
                    <p>暂无重复文件，点击"查找重复文件"开始检测</p>
                  </Card>
                ) : (
                  duplicates.map((group, index) => (
                    <Card
                      key={index}
                      title={`重复组 ${index + 1}`}
                      extra={<Tag color="red">{group.length} 个文件</Tag>}
                      style={{ marginBottom: 16 }}
                    >
                      <Table
                        size="small"
                        columns={[
                          { title: '文件名', dataIndex: 'name', key: 'name' },
                          { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
                          { title: '大小', dataIndex: 'size', key: 'size',
                            render: (size) => (size / 1024).toFixed(2) + ' KB' },
                          {
                            title: '操作',
                            key: 'action',
                            render: (_, record) => (
                              <Popconfirm
                                title="确定删除此文件？"
                                onConfirm={() => deleteFile(record.path)}
                                okText="删除"
                                cancelText="取消"
                              >
                                <Button
                                  type="link"
                                  danger
                                  icon={<DeleteOutlined />}
                                  size="small"
                                >
                                  删除
                                </Button>
                              </Popconfirm>
                            )
                          }
                        ]}
                        dataSource={group}
                        rowKey="path"
                        pagination={false}
                        onRow={(record) => ({
                          onContextMenu: (e) => {
                            e.preventDefault()
                            showContextMenu(record.path)
                          }
                        })}
                      />
                    </Card>
                  ))
                )}
              </div>
            )
          }
        ]}
      />
    </div>
  )
}
