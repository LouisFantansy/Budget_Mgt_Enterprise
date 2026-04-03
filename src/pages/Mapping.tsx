import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Link2 } from 'lucide-react'
import { importExportApi } from '../api/modules/import-export.api'
import type { DataMappingItem } from '../api/modules/import-export.api'
import type { MatchStatus } from '../types'

export function Mapping() {
  const [loading, setLoading] = useState(true)
  const [autoMatching, setAutoMatching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mappings, setMappings] = useState<DataMappingItem[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState<MatchStatus | ''>('')
  
  // Manual match modal
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<DataMappingItem | null>(null)
  const [budgetNo, setBudgetNo] = useState('')
  const [matching, setMatching] = useState(false)

  const fetchMappings = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await importExportApi.getMappings({
        page,
        pageSize: pagination.pageSize,
        matchStatus: filterStatus || undefined,
      })
      
      setMappings(response.data.items)
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: response.data.totalPages,
      })
    } catch (err: any) {
      console.error('Failed to fetch mappings:', err)
      setError(err.response?.data?.message || '获取映射列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMappings(1)
  }, [filterStatus])

  const handleAutoMatch = async () => {
    try {
      setAutoMatching(true)
      setError(null)
      
      const result = await importExportApi.autoMatch()
      
      // Refresh the list
      await fetchMappings(pagination.page)
      
      alert(`自动匹配完成：成功匹配 ${result.data.matched} 条，共处理 ${result.data.total} 条`)
    } catch (err: any) {
      console.error('Auto match failed:', err)
      setError(err.response?.data?.message || '自动匹配失败')
    } finally {
      setAutoMatching(false)
    }
  }

  const handleOpenMatchModal = (mapping: DataMappingItem) => {
    setSelectedMapping(mapping)
    setBudgetNo(mapping.budgetNo || '')
    setShowMatchModal(true)
  }

  const handleManualMatch = async () => {
    if (!selectedMapping || !budgetNo.trim()) {
      return
    }

    try {
      setMatching(true)
      
      await importExportApi.manualMatch(selectedMapping.id, { budgetNo: budgetNo.trim() })
      
      // Update local state
      setMappings(prev => prev.map(m => 
        m.id === selectedMapping.id 
          ? { ...m, budgetNo: budgetNo.trim(), matchStatus: 'FULL' as MatchStatus }
          : m
      ))
      
      setShowMatchModal(false)
      setSelectedMapping(null)
      setBudgetNo('')
    } catch (err: any) {
      console.error('Manual match failed:', err)
      setError(err.response?.data?.message || '手动匹配失败')
    } finally {
      setMatching(false)
    }
  }

  const statusConfig: Record<MatchStatus, { label: string; className: string; icon: any }> = {
    FULL: { label: '已匹配', className: 'tag-success', icon: CheckCircle },
    PARTIAL: { label: '部分匹配', className: 'tag-warning', icon: AlertCircle },
    NONE: { label: '未匹配', className: 'tag-danger', icon: XCircle },
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-'
    if (Math.abs(value) >= 10000) return `¥${(value / 10000).toFixed(0)}万`
    return `¥${value.toFixed(0)}`
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }

  // Calculate stats
  const stats = {
    total: pagination.total,
    matched: mappings.filter(m => m.matchStatus === 'FULL').length,
    partial: mappings.filter(m => m.matchStatus === 'PARTIAL').length,
    unmatched: mappings.filter(m => m.matchStatus === 'NONE').length,
  }

  return (
    <div className="mapping-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据映射</h1>
          <p className="page-subtitle">关联预算-采购-财务三单数据</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleAutoMatch}
          disabled={autoMatching}
        >
          {autoMatching ? (
            <>
              <Loader2 className="spinner" size={16} /> 匹配中...
            </>
          ) : (
            <>
              <RefreshCw size={16} /> 自动匹配
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">总记录数</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已匹配</div>
          <div className="stat-value text-success">{stats.matched}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">部分匹配</div>
          <div className="stat-value text-warning">{stats.partial}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">未匹配</div>
          <div className="stat-value text-danger">{stats.unmatched}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">映射列表</h3>
          <div className="filter-group">
            <select 
              className="select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as MatchStatus | '')}
            >
              <option value="">全部状态</option>
              <option value="FULL">已匹配</option>
              <option value="PARTIAL">部分匹配</option>
              <option value="NONE">未匹配</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={32} />
            <p>加载中...</p>
          </div>
        ) : mappings.length === 0 ? (
          <div className="empty-state">暂无映射数据</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>预算编号</th>
                <th>采购订单</th>
                <th>结算单</th>
                <th>金额差异</th>
                <th>状态</th>
                <th>验证时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => {
                const status = statusConfig[mapping.matchStatus]
                return (
                  <tr key={mapping.id}>
                    <td className="font-medium">{mapping.budgetNo || '-'}</td>
                    <td>
                      {mapping.purchaseOrderNo || '-'}
                      {mapping.purchaseOrder && (
                        <div className="text-secondary text-sm">
                          {formatCurrency(mapping.purchaseOrder.amount)} | {mapping.purchaseOrder.supplier}
                        </div>
                      )}
                    </td>
                    <td>
                      {mapping.settlementNo || '-'}
                      {mapping.settlement && (
                        <div className="text-secondary text-sm">
                          {formatCurrency(mapping.settlement.amount)} | {mapping.settlement.supplier}
                        </div>
                      )}
                    </td>
                    <td className={mapping.amountDiff && mapping.amountDiff !== 0 ? 'text-warning' : ''}>
                      {formatCurrency(mapping.amountDiff)}
                    </td>
                    <td>
                      <span className={`tag ${status.className}`}>
                        <status.icon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td>{formatDate(mapping.verifiedAt)}</td>
                    <td>
                      {mapping.matchStatus !== 'FULL' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenMatchModal(mapping)}
                        >
                          <Link2 size={14} /> 手动匹配
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchMappings(pagination.page - 1)}
            >
              上一页
            </button>
            <span className="page-info">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <button 
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchMappings(pagination.page + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* Manual Match Modal */}
      {showMatchModal && selectedMapping && (
        <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">手动匹配</h3>
              <button className="modal-close" onClick={() => setShowMatchModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="mapping-info">
                <p><strong>采购订单：</strong>{selectedMapping.purchaseOrderNo || '-'}</p>
                <p><strong>结算单：</strong>{selectedMapping.settlementNo || '-'}</p>
              </div>
              <div className="input-group">
                <label className="input-label">预算编号</label>
                <input 
                  type="text"
                  className="input"
                  value={budgetNo}
                  onChange={(e) => setBudgetNo(e.target.value)}
                  placeholder="请输入要关联的预算编号"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMatchModal(false)}>取消</button>
              <button 
                className="btn btn-primary"
                onClick={handleManualMatch}
                disabled={matching || !budgetNo.trim()}
              >
                {matching ? '匹配中...' : '确认匹配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
