import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { budgetApi } from '../api/modules/budget.api'
import type { Budget, BudgetItem } from '../types'

export function BudgetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchBudget = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const response = await budgetApi.getById(id)
        if (response.data) {
          setBudget(response.data)
          setItems(response.data.items || [])
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '加载预算详情失败')
      } finally {
        setLoading(false)
      }
    }
    fetchBudget()
  }, [id])

  const formatCurrency = (value: number) => {
    return `¥${(value / 10000).toFixed(0)}万`
  }

  const handleSubmitApproval = async () => {
    if (!budget) return
    if (!confirm('确定要提交审批吗？')) return
    
    setSubmitting(true)
    try {
      await budgetApi.submitForApproval(budget.id)
      alert('提交审批成功')
      // 刷新数据
      const response = await budgetApi.getById(budget.id)
      if (response.data) {
        setBudget(response.data)
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '提交审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  const statusLabels: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',
    APPROVED: '已审批',
    REJECTED: '已拒绝',
    ADJUSTED: '已调整',
    CLOSED: '已关闭',
  }

  if (loading) {
    return (
      <div className="budget-detail">
        <div className="page-header">
          <div>
            <Link to="/budgets" className="back-link">
              <ArrowLeft size={16} /> 返回列表
            </Link>
          </div>
        </div>
        <div className="card mt-4" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !budget) {
    return (
      <div className="budget-detail">
        <div className="page-header">
          <div>
            <Link to="/budgets" className="back-link">
              <ArrowLeft size={16} /> 返回列表
            </Link>
          </div>
        </div>
        <div className="card mt-4" style={{ padding: '16px', color: 'var(--danger)' }}>
          {error || '预算不存在'}
        </div>
      </div>
    )
  }

  const usageRate = budget.totalAmount > 0 
    ? ((budget.usedAmount / budget.totalAmount) * 100).toFixed(1) 
    : '0.0'
  const remaining = budget.totalAmount - budget.usedAmount

  return (
    <div className="budget-detail">
      <div className="page-header">
        <div>
          <Link to="/budgets" className="back-link">
            <ArrowLeft size={16} /> 返回列表
          </Link>
          <h1 className="page-title">{budget.name}</h1>
        </div>
        <div className="header-actions">
          {budget.status === 'APPROVED' && (
            <Link to={`/budgets/${id}/adjust`} className="btn btn-secondary">
              <Edit size={16} /> 调整预算
            </Link>
          )}
          {budget.status === 'DRAFT' && (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmitApproval}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 处理中...
                </>
              ) : (
                <>
                  <Send size={16} /> 提交审批
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status & Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">预算金额</div>
          <div className="stat-value">{formatCurrency(budget.totalAmount)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已使用</div>
          <div className="stat-value">{formatCurrency(budget.usedAmount)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">剩余</div>
          <div className="stat-value">{formatCurrency(remaining)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">执行率</div>
          <div className="stat-value">{usageRate}%</div>
          <div className="progress mt-4">
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(Number(usageRate), 100)}%`,
                background: Number(usageRate) > 100 ? '#ff3b30' : Number(usageRate) > 80 ? '#ff9500' : '#34c759',
              }}
            />
          </div>
        </div>
      </div>

      {/* Budget Info */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">基本信息</h3>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">预算编号</span>
            <span className="info-value">{budget.budgetNo}</span>
          </div>
          <div className="info-item">
            <span className="info-label">所属部门</span>
            <span className="info-value">{budget.department?.name || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">预算类型</span>
            <span className="info-value">{budget.type === 'OPEX' ? '运营性支出' : '资本性支出'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">年度</span>
            <span className="info-value">{budget.year}</span>
          </div>
          <div className="info-item">
            <span className="info-label">状态</span>
            <span className="info-value">
              <span className={`tag ${
                budget.status === 'APPROVED' ? 'tag-success' : 
                budget.status === 'PENDING' ? 'tag-warning' : 
                budget.status === 'REJECTED' ? 'tag-danger' : 'tag-primary'
              }`}>
                {statusLabels[budget.status]}
              </span>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">创建时间</span>
            <span className="info-value">{new Date(budget.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Budget Items */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">预算明细</h3>
        </div>
        {items.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>项目</th>
                <th>类别</th>
                <th>预算金额</th>
                <th>已使用</th>
                <th>剩余</th>
                <th>执行率</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const rate = item.totalAmount > 0 
                  ? ((item.usedAmount / item.totalAmount) * 100).toFixed(1) 
                  : '0.0'
                return (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.category}</td>
                    <td>{formatCurrency(item.totalAmount)}</td>
                    <td>{formatCurrency(item.usedAmount)}</td>
                    <td>{formatCurrency(item.totalAmount - item.usedAmount)}</td>
                    <td>
                      <span
                        className={`tag ${
                          Number(rate) > 100 ? 'tag-danger' : Number(rate) > 80 ? 'tag-warning' : 'tag-success'
                        }`}
                      >
                        {rate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>暂无预算明细</p>
          </div>
        )}
      </div>

      {/* Remark */}
      {budget.remark && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">备注</h3>
          </div>
          <div style={{ padding: '16px' }}>
            {budget.remark}
          </div>
        </div>
      )}
    </div>
  )
}
