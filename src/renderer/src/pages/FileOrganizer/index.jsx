import React, { useState, useEffect } from 'react'
import { Card, Button, Select, Checkbox, Table, Tree, Row, Col, message, Spin, Space, Tag, Input, Popconfirm } from 'antd'
import { FolderOpenOutlined, ThunderboltOutlined, CheckOutlined, UndoOutlined, FolderAddOutlined } from '@ant-design/icons'

const { Option } = Select

export default function FileOrganizer() {
  const [selectedFolder, setSelectedFolder] = useState('desktop')
  const [customPath, setCustomPath] = useState('')
  const [useAI, setUseAI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [preview, setPreview] = useState({})
  const [specialPaths, setSpecialPaths] = useState({})
  const [history, setHistory] = useState([])

  useEffect(() => {
    loadSpecialPaths()
    loadHistory()
  }, [])

  const loadSpecialPaths = async () => {
    try {
      const paths = await window.electronAPI.getSpecialPaths()
      setSpecialPaths(paths)
    } catch (error) {
      message.error('获取系统路径失败：' + error.message)
    }
  }

  const loadHistory = async () => {
    try {
      const historyData = await window.electronAPI.organizeHistory()
      setHistory(historyData)
    } catch (error) {
      console.error('获取历史失败:', error)
    }
  }

  const handleSelectCustomPath = async () => {
    try {
      const dirPath = await window.electronAPI.selectDirectory()
      if (dirPath) {
        setCustomPath(dirPath)
        setSelectedFolder('custom')
        message.success('已选择自定义路径')
      }
    } catch (error) {
      message.error('选择路径失败：' + error.message)
    }
  }

  const getCurrentPath = () => {
    if (selectedFolder === 'custom') {
      return customPath
    }
    return specialPaths[selectedFolder]
  }

  const handleScan = async () => {
    setLoading(true)
    try {
      const dirPath = getCurrentPath()
      if (!dirPath) {
        message.error('请先选择文件夹')
        return
      }

      const result = await window.electronAPI.organizeScan(dirPath, useAI)
      setFiles(result)
      setSelectedFiles(result.map(f => f.path))
      generatePreview(result)
      message.success(`扫描完成，找到 ${result.length} 个文件`)
    } catch (error) {
      message.error('扫描失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generatePreview = (fileList) => {
    const tree = {}
    fileList.forEach(file => {
      const category = file.smartCategory || file.basicCategory
      if (!tree[category]) {
        tree[category] = []
      }
      tree[category].push(file)
    })
    setPreview(tree)
  }

  const handleOrganize = async () => {
    if (selectedFiles.length === 0) {
      message.warning('请至少选择一个文件')
      return
    }

    const dirPath = getCurrentPath()
    const organizeDir = dirPath + '\\整理后'

    const operations = selectedFiles.map(filePath => {
      const file = files.find(f => f.path === filePath)
      const category = file.smartCategory || file.basicCategory
      const targetPath = organizeDir + '\\' + category + '\\' + file.name
      return { sourcePath: filePath, targetPath }
    })

    setLoading(true)
    try {
      const results = await window.electronAPI.organizeExecute(operations)
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (failCount > 0) {
        message.warning(`整理完成！成功 ${successCount} 个，失败 ${failCount} 个`)
      } else {
        message.success(`整理完成！成功移动 ${successCount} 个文件`)
      }

      await loadHistory()
      handleScan()
    } catch (error) {
      message.error('整理失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.organizeUndo()
      const successCount = result.results.filter(r => r.success).length
      message.success(`撤回成功！已恢复 ${successCount} 个文件`)
      await loadHistory()
      handleScan()
    } catch (error) {
      message.error('撤回失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: '40%'
    },
    {
      title: '基础分类',
      dataIndex: 'basicCategory',
      key: 'basicCategory',
      width: '15%',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'AI分类',
      dataIndex: 'smartCategory',
      key: 'smartCategory',
      width: '15%',
      render: (text) => text ? <Tag color="green">{text}</Tag> : <Tag>未分析</Tag>
    },
    {
      title: '时间',
      dataIndex: 'timeCategory',
      key: 'timeCategory',
      width: '10%',
      render: (text) => <Tag color="orange">{text}</Tag>
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: '10%',
      render: (size) => {
        if (size < 1024) return size + ' B'
        if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
        return (size / (1024 * 1024)).toFixed(2) + ' MB'
      }
    }
  ]

  const rowSelection = {
    selectedRowKeys: selectedFiles,
    onChange: (selectedRowKeys) => {
      setSelectedFiles(selectedRowKeys)
    }
  }

  const treeData = Object.keys(preview).map(category => ({
    title: `📁 ${category} (${preview[category].length}个文件)`,
    key: category,
    children: preview[category].map(file => ({
      title: file.name,
      key: file.path,
      isLeaf: true
    }))
  }))

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{
        marginBottom: 32,
        fontSize: 28,
        fontWeight: 600,
        color: '#2c2c2c'
      }}>
        文件整理
      </h1>

      <Card
        style={{
          marginBottom: 24,
          background: '#ffffff'
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Space size="middle" wrap>
          <span style={{ color: '#666', fontWeight: 500 }}>选择文件夹：</span>
          <Select
            value={selectedFolder}
            onChange={setSelectedFolder}
            style={{ width: 160 }}
          >
            <Option value="desktop">📁 桌面</Option>
            <Option value="downloads">📥 下载</Option>
            <Option value="documents">📄 文档</Option>
            <Option value="custom">🔍 自定义路径</Option>
          </Select>

          {selectedFolder === 'custom' && (
            <>
              <Button
                icon={<FolderAddOutlined />}
                onClick={handleSelectCustomPath}
              >
                选择路径
              </Button>
              {customPath && (
                <span style={{
                  color: '#999',
                  fontSize: 13,
                  background: '#f5f5f5',
                  padding: '4px 12px',
                  borderRadius: '6px'
                }}>
                  {customPath}
                </span>
              )}
            </>
          )}

          <Checkbox checked={useAI} onChange={(e) => setUseAI(e.target.checked)}>
            <ThunderboltOutlined /> 启用AI智能分类
          </Checkbox>

          <Button
            type="primary"
            icon={<FolderOpenOutlined />}
            onClick={handleScan}
            loading={loading}
          >
            开始扫描
          </Button>

          {history.length > 0 && (
            <Popconfirm
              title="确定要撤回最近一次整理操作吗？"
              onConfirm={handleUndo}
              okText="确定"
              cancelText="取消"
            >
              <Button
                icon={<UndoOutlined />}
                disabled={loading}
              >
                撤回 ({history.length})
              </Button>
            </Popconfirm>
          )}

          {files.length > 0 && (
            <span style={{
              color: '#666',
              fontSize: 14,
              background: '#f0f0f0',
              padding: '6px 14px',
              borderRadius: '8px'
            }}>
              已扫描 {files.length} 个文件，已选择 {selectedFiles.length} 个
            </span>
          )}
        </Space>
      </Card>

      {files.length > 0 && (
        <Row gutter={24}>
          <Col span={14}>
            <Card
              title={<span style={{ fontSize: 16, fontWeight: 500 }}>文件列表</span>}
              extra={
                <Space>
                  <Button
                    size="small"
                    onClick={() => setSelectedFiles(files.map(f => f.path))}
                  >
                    全选
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedFiles([])}
                  >
                    取消全选
                  </Button>
                </Space>
              }
            >
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={files}
                rowKey="path"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Card>
          </Col>

          <Col span={10}>
            <Card
              title={<span style={{ fontSize: 16, fontWeight: 500 }}>分类预览</span>}
              extra={
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleOrganize}
                  loading={loading}
                  disabled={selectedFiles.length === 0}
                  style={{ height: 36 }}
                >
                  开始整理
                </Button>
              }
            >
              {treeData.length > 0 ? (
                <Tree
                  treeData={treeData}
                  defaultExpandAll
                  showLine
                  showIcon={false}
                  style={{ background: '#fafafa', padding: '12px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: '#999',
                  background: '#fafafa',
                  borderRadius: '8px'
                }}>
                  暂无预览数据
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {files.length === 0 && !loading && (
        <Card style={{ background: '#ffffff' }}>
          <div style={{
            textAlign: 'center',
            padding: '80px 0',
            color: '#999'
          }}>
            <FolderOpenOutlined style={{
              fontSize: 64,
              marginBottom: 24,
              color: '#d0d0d0'
            }} />
            <p style={{ fontSize: 16, color: '#666' }}>请选择文件夹并点击"开始扫描"</p>
          </div>
        </Card>
      )}

      {loading && (
        <Card style={{ background: '#ffffff' }}>
          <div style={{
            textAlign: 'center',
            padding: '80px 0'
          }}>
            <Spin size="large" />
            <p style={{
              marginTop: 24,
              color: '#666',
              fontSize: 15
            }}>
              {useAI ? '正在扫描并分析文件...' : '正在扫描文件...'}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}



