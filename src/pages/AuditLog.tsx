import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, Download, Search } from 'lucide-react'
import { auditApi } from '../api/modules/audit.api'
import type { AuditLog } from '../types'

interface FilterState {
  userId: string
  action: string
  module: string
  startDate: string
  endDate: string
}

export function AuditLog() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    userId: '',
    action: '',
    module: '',
    startDate: '',
    endDate: '',
  })
  
  // Available filter options
  const [modules] = useState(['预算', '采购', '用户', '角色', '部门', '系统'])
  const [actions] = useState(['创建', '更新', '删除', '审批', '导出', '导入'])

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await auditApi.getList({
        page,
        pageSize: pagination.pageSize,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        module: filters.module || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      })
      
      setLogs(response.data.items)
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: response.data.totalPages,
      })
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err)
      setError(err.response?.data?.message || '获取审计日志失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [])

  const handleSearch = () => {
    fetchLogs(1)
  }

  const handleReset = () => {
    setFilters({
      userId: '',
      action: '',
      module: '',
      startDate: '',
      endDate: '',
    })
    fetchLogs(1)
  }

  const handleExport = async () => {
    try {
      await auditApi.exportLogs({
        page: 1,
        pageSize: 1000,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        module: filters.module || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      })
    } catch (err: any) {
      console.error('Export failed:', err)
      setError('导出失败')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const getActionTag = (action: string) => {
    const actionColors: Record<string, string> = {
      '创建': 'tag-success',
      '更新': 'tag-info',
      '删除': 'tag-danger',
      '审批': 'tag-warning',
      '导出': 'tag-info',
      '导入': 'tag-info',
    }
    return actionColors[action] || 'tag-default'
  }

  return (
    <div className="audit-log-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">审计日志</h1>
          <p className="page-subtitle">查看系统操作记录</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={16} /> 导出日志
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="filters-grid">
          <div className="input-group">
            <label className="input-label">用户</label>
            <input
              type="text"
              className="input"
              placeholder="输入用户名或ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">操作类型</label>
            <select
              className="select"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">全部</option>
              {actions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">模块</label>
            <select
              className="select"
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            >
              <option value="">全部</option>
              {modules.map((module) => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">开始日期</label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">结束日期</label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleSearch}>
              <Search size={16} /> 查询
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">日志列表</h3>
          <span className="text-secondary">共 {pagination.total} 条记录</span>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={32} />
            <p>加载中...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">暂无审计日志</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>用户</th>
                <th>操作类型</th>
                <th>模块</th>
                <th>目标</th>
                <th>IP地址</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="font-medium">{log.userName}</td>
                  <td>
                    <span className={`tag ${getActionTag(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.module}</td>
                  <td>
                    {log.targetType && (
                      <span>
                        {log.targetType}
                        {log.targetId && <span className="text-secondary"> ({log.targetId.slice(0, 8)}...)</span>}
                      </span>
                    )}
                  </td>
                  <td className="text-secondary">{log.ip || '-'}</td>
                  <td>
                    {(log.oldValue || log.newValue) && (
                      <button className="btn-link">查看变更</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              上一页
            </button>
            <span className="page-info">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <button 
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
