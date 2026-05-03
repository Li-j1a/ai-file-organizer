import React, { useState } from 'react'
import { Input, Button, Table, Card, Space, message, Tag, Checkbox, DatePicker, Progress, Slider, Tooltip } from 'antd'
import { SearchOutlined, FolderOpenOutlined, DatabaseOutlined, ThunderboltOutlined, InfoCircleOutlined } from '@ant-design/icons'

const { RangePicker } = DatePicker
const { TextArea } = Input

export default function SmartSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [indexPath, setIndexPath] = useState('')
  const [indexCount, setIndexCount] = useState(0)
  const [indexing, setIndexing] = useState(false)

  // 过滤条件
  const [filters, setFilters] = useState({
    extensions: [],
    createTimeRange: null,
    modifyTimeRange: null,
    useAI: false,
    contentLength: 2000  // AI读取的文件内容长度
  })

  const buildIndex = async () => {
    if (!indexPath) {
      message.warning('请输入要索引的目录路径')
      return
    }

    setIndexing(true)
    try {
      const count = await window.electronAPI.buildIndex(indexPath)
      setIndexCount(count)
      message.success(`索引完成！共索引 ${count} 个文件`)
    } catch (error) {
      message.error('索引失败：' + error.message)
    } finally {
      setIndexing(false)
    }
  }

  const handleSelectDirectory = async () => {
    try {
      const dirPath = await window.electronAPI.selectDirectory()
      if (dirPath) {
        setIndexPath(dirPath)
      }
    } catch (error) {
      message.error('选择目录失败：' + error.message)
    }
  }

  const search = async () => {
    if (!query.trim()) {
      message.warning('请输入搜索内容或描述')
      return
    }

    if (indexCount === 0) {
      message.warning('请先建立文件索引')
      return
    }

    setLoading(true)
    try {
      const searchParams = {
        query: query.trim(),
        filters: {
          ...filters,
          createTimeRange: filters.createTimeRange ? [
            filters.createTimeRange[0].valueOf(),
            filters.createTimeRange[1].valueOf()
          ] : null,
          modifyTimeRange: filters.modifyTimeRange ? [
            filters.modifyTimeRange[0].valueOf(),
            filters.modifyTimeRange[1].valueOf()
          ] : null
        }
      }

      const result = await window.electronAPI.aiSearchFiles(searchParams)
      setResults(result)
      message.success(`找到 ${result.length} 个相关文件`)
    } catch (error) {
      message.error('搜索失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true
    },
    {
      title: '相关性',
      dataIndex: 'relevance',
      key: 'relevance',
      width: 150,
      render: (relevance) => relevance ? (
        <Space>
          <Progress
            percent={relevance}
            size="small"
            style={{ width: 80 }}
            strokeColor={relevance > 70 ? '#52c41a' : relevance > 40 ? '#faad14' : '#ff4d4f'}
          />
          <span style={{ fontWeight: 500 }}>{relevance}%</span>
        </Space>
      ) : '-',
      sorter: (a, b) => (b.relevance || 0) - (a.relevance || 0),
      defaultSortOrder: 'descend'
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => {
        if (size < 1024) return size + ' B'
        if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
        return (size / (1024 * 1024)).toFixed(2) + ' MB'
      }
    },
    {
      title: '类型',
      dataIndex: 'ext',
      key: 'ext',
      width: 80,
      render: (ext) => <Tag color="blue">{ext}</Tag>
    },
    {
      title: '修改时间',
      dataIndex: 'modified',
      key: 'modified',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    }
  ]

  const extensionOptions = [
    { label: '文档 (.txt, .md, .doc, .docx, .pdf)', value: '.txt,.md,.doc,.docx,.pdf' },
    { label: '表格 (.xlsx, .xls, .csv)', value: '.xlsx,.xls,.csv' },
    { label: '代码 (.js, .ts, .py, .java, .cpp)', value: '.js,.ts,.py,.java,.cpp' },
    { label: '图片 (.jpg, .png, .gif)', value: '.jpg,.png,.gif' },
    { label: '视频 (.mp4, .avi, .mkv)', value: '.mp4,.avi,.mkv' }
  ]

  const getTokenEstimate = (length) => {
    // 粗略估算：1个token约等于4个字符
    return Math.ceil(length / 4)
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{
        marginBottom: 32,
        fontSize: 28,
        fontWeight: 600,
        color: '#2c2c2c'
      }}>
        AI智能搜索
      </h1>

      <Card
        title={<><DatabaseOutlined /> 1. 建立文件索引</>}
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Input
              placeholder="输入要索引的目录"
              style={{ width: 400 }}
              value={indexPath}
              onChange={(e) => setIndexPath(e.target.value)}
            />
            <Button
              icon={<FolderOpenOutlined />}
              onClick={handleSelectDirectory}
            >
              选择目录
            </Button>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              onClick={buildIndex}
              loading={indexing}
            >
              建立索引
            </Button>
          </Space>
          {indexCount > 0 && (
            <Tag color="success">已索引 {indexCount} 个文件</Tag>
          )}
        </Space>
      </Card>

      <Card
        title={<><SearchOutlined /> 2. 搜索文件</>}
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              <Checkbox
                checked={filters.useAI}
                onChange={(e) => setFilters({ ...filters, useAI: e.target.checked })}
              >
                <ThunderboltOutlined /> 启用AI语义搜索
              </Checkbox>
            </div>
            <TextArea
              placeholder={filters.useAI
                ? "描述你要找的文件，例如：包含项目计划的Word文档，或者关于机器学习的PDF资料"
                : "输入文件名关键词"}
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onPressEnter={search}
            />
          </div>

          {filters.useAI && (
            <div>
              <h4 style={{ marginBottom: 12 }}>
                AI读取内容长度
                <Tooltip title="控制AI读取每个文件的字符数，减少可节省Token消耗">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: '#999' }} />
                </Tooltip>
              </h4>
              <Slider
                min={500}
                max={5000}
                step={500}
                value={filters.contentLength}
                onChange={(value) => setFilters({ ...filters, contentLength: value })}
                marks={{
                  500: '500字',
                  2000: '2000字',
                  5000: '5000字'
                }}
                style={{ width: 400 }}
              />
              <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                当前设置：{filters.contentLength} 字符 (约 {getTokenEstimate(filters.contentLength)} tokens)
              </div>
            </div>
          )}

          <div>
            <h4 style={{ marginBottom: 12 }}>过滤条件（可选）</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span style={{ marginRight: 12, color: '#666' }}>文件类型：</span>
                <Checkbox.Group
                  options={extensionOptions}
                  value={filters.extensions}
                  onChange={(values) => setFilters({ ...filters, extensions: values })}
                />
              </div>

              <div>
                <span style={{ marginRight: 12, color: '#666' }}>创建时间：</span>
                <RangePicker
                  value={filters.createTimeRange}
                  onChange={(dates) => setFilters({ ...filters, createTimeRange: dates })}
                  style={{ width: 300 }}
                />
              </div>

              <div>
                <span style={{ marginRight: 12, color: '#666' }}>修改时间：</span>
                <RangePicker
                  value={filters.modifyTimeRange}
                  onChange={(dates) => setFilters({ ...filters, modifyTimeRange: dates })}
                  style={{ width: 300 }}
                />
              </div>
            </Space>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={search}
            loading={loading}
            style={{ width: 200 }}
          >
            开始搜索
          </Button>
        </Space>
      </Card>

      {results.length > 0 && (
        <Card title={`搜索结果 (${results.length})`}>
          <Table
            columns={columns}
            dataSource={results}
            rowKey="path"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      )}
    </div>
  )
}
