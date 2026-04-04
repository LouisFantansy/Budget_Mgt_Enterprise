import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { reportApi } from '../api/modules/report.api'

// 后端实际返回的数据结构
interface BackendDashboardData {
  totalBudgets: number
  approvedBudgets: number
  pendingBudgets: number
  totalPurchases: number
  pendingPurchases: number
  executionRate: number
  totalBudgetAmount: number
  usedBudgetAmount: number
}

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<BackendDashboardData | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = (await reportApi.getDashboard()) as any
        // API 响应解包：统一处理响应格式
        const dashData = response?.data?.data || response?.data
        if (dashData) {
          setDashboardData(dashData)
        } else {
          setError('获取仪表板数据失败')
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err.response?.data?.message || '获取仪表板数据失败')
      } finally {
        setLoading(false)
      }
    }
  
    fetchDashboard()
  }, [])

  const formatCurrency = (value: number) => {
    if (!value) return '¥0'
    if (value >= 10000000) return `¥${(value / 10000000).toFixed(1)}M`
    if (value >= 10000) return `¥${(value / 10000).toFixed(0)}K`
    return `¥${value.toFixed(0)}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            重试
          </button>
        </div>
      </div>
    )
  }

  // 使用后端返回的数据，如果没有数据则使用默认值
  const data = dashboardData || {
    totalBudgets: 0,
    approvedBudgets: 0,
    pendingBudgets: 0,
    totalPurchases: 0,
    pendingPurchases: 0,
    executionRate: 0,
    totalBudgetAmount: 0,
    usedBudgetAmount: 0,
  }

  const usageRate = data.executionRate * 100

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">仪表盘</h1>
          <p className="page-subtitle">预算执行情况总览</p>
        </div>
        <Link to="/budgets/create" className="btn btn-primary">
          新建预算
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">年度预算总额</div>
          <div className="stat-value">{formatCurrency(Number(data.totalBudgetAmount))}</div>
          <div className="progress mt-4">
            <div className="progress-bar" style={{ width: `${Math.min(usageRate, 100)}%`, background: '#0071e3' }} />
          </div>
          <div className="stat-footer">
            <span>已使用 {usageRate.toFixed(1)}%</span>
            <span>剩余 {formatCurrency(Number(data.totalBudgetAmount) - Number(data.usedBudgetAmount))}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">已批准预算</div>
          <div className="stat-value">{data.approvedBudgets}</div>
          <div className="stat-footer">
            <span>总预算数: {data.totalBudgets}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">待审批</div>
          <div className="stat-value">{data.pendingBudgets + data.pendingPurchases}</div>
          <div className="stat-footer">
            <span>预算: {data.pendingBudgets}</span>
            <span>采购: {data.pendingPurchases}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">采购申请</div>
          <div className="stat-value">{data.totalPurchases}</div>
          <div className="stat-footer">
            <span>待审批: {data.pendingPurchases}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">快捷操作</h3>
        </div>
        <div className="quick-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/budgets/create" className="btn btn-primary">新建预算</Link>
          <Link to="/purchase/create" className="btn btn-secondary">新建采购申请</Link>
          <Link to="/budgets" className="btn btn-secondary">查看预算列表</Link>
          <Link to="/approval" className="btn btn-secondary">审批中心</Link>
        </div>
      </div>
    </div>
  )
}
