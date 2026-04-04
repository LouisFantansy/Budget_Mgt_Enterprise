import { useState, useEffect } from 'react'
import { FileText, Download, Eye, Edit, Trash2, Loader2 } from 'lucide-react'
import { budgetApi } from '../api/modules/budget.api'

interface BudgetSummary {
  id: string
  version: string
  department: string
  type: string
  totalAmount: number
  status: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export function BudgetSummary() {
  const [summaries, setSummaries] = useState<BudgetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchSummaries()
  }, [filterType, filterStatus])

  const fetchSummaries = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await budgetApi.getList({ 
        page: 1, 
        pageSize: 50,
        type: filterType as any || undefined,
        status: filterStatus.toUpperCase() as any || undefined
      }) as any
      console.log('Budget API response:', response)
      if (response && response.data) {
        const items = response.data.data?.items || []
        console.log('Budget items:', items)
        setSummaries(items)
      }
    } catch (err: any) {
      console.error('Failed to fetch summaries:', err)
      setError(err.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(0)}万`

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'tag-primary' },
    pending: { label: '审批中', color: 'tag-warning' },
    approved: { label: '已批准', color: 'tag-success' },
    rejected: { label: '已拒绝', color: 'tag-danger' },
  }

  return (
    <div className="budget-summary-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">预算汇总</h1>
          <p className="page-subtitle">查看各部门预算汇总报表</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="filters-row">
          <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: '150px' }}>
            <option value="">全部类型</option>
            <option value="Opex">Opex</option>
            <option value="Capex">Capex</option>
          </select>
          <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '150px' }}>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">审批中</option>
            <option value="approved">已批准</option>
          </select>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">预算汇总表</h3>
        </div>
        {error && (
          <div className="error-message" style={{ padding: '16px', color: 'var(--danger)' }}>
            错误: {error}
          </div>
        )}
        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={32} />
            <p>加载中...</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>版本</th>
                <th>部门</th>
                <th>类型</th>
                <th>总金额</th>
                <th>状态</th>
                <th>创建人</th>
                <th>创建日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                    暂无数据
                  </td>
                </tr>
              ) : (
                summaries.map((summary) => (
                  <tr key={summary.id}>
                    <td className="font-medium">{summary.version || '-'}</td>
                    <td>{summary.department || '-'}</td>
                    <td>
                      <span className={`tag ${summary.type === 'Capex' ? 'tag-primary' : 'tag-success'}`}>
                        {summary.type || '-'}
                      </span>
                    </td>
                    <td>{formatCurrency(summary.totalAmount || 0)}</td>
                    <td>
                      <span className={`tag ${statusLabels[summary.status]?.color || 'tag-primary'}`}>
                        {statusLabels[summary.status]?.label || summary.status || '-'}
                      </span>
                    </td>
                    <td>{summary.createdBy || '-'}</td>
                    <td>{summary.createdAt || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon-sm" title="查看">
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon-sm" title="下载">
                          <Download size={14} />
                        </button>
                        {summary.status === 'draft' && (
                          <>
                            <button className="btn-icon-sm" title="编辑">
                              <Edit size={14} />
                            </button>
                            <button className="btn-icon-sm" title="删除">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Department Breakdown */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">部门明细</h3>
        </div>
        <div className="dept-breakdown">
          <div className="dept-card">
            <div className="dept-card-header">
              <FileText size={20} />
              <span className="dept-name">研发部</span>
            </div>
            <div className="dept-card-body">
              <div className="stat-row">
                <span className="stat-label">Opex:</span>
                <span className="stat-value">¥1,200 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Capex:</span>
                <span className="stat-value">¥800 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">总计:</span>
                <span className="stat-value text-primary">¥2,000 万</span>
              </div>
            </div>
          </div>
          <div className="dept-card">
            <div className="dept-card-header">
              <FileText size={20} />
              <span className="dept-name">测试部</span>
            </div>
            <div className="dept-card-body">
              <div className="stat-row">
                <span className="stat-label">Opex:</span>
                <span className="stat-value">¥600 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Capex:</span>
                <span className="stat-value">¥400 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">总计:</span>
                <span className="stat-value text-primary">¥1,000 万</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}