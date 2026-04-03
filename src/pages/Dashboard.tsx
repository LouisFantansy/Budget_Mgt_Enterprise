import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { reportApi } from '../api/modules/report.api'
import type { DashboardData } from '../api/modules/report.api'

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await reportApi.getDashboard()
        setDashboardData(response.data)
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err.response?.data?.message || '获取仪表盘数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const formatCurrency = (value: number) => {
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
          <AlertTriangle size={48} />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            重试
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (!dashboardData) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <p>暂无数据</p>
        </div>
      </div>
    )
  }

  const { overview, budgetByType, budgetByDepartment, recentApprovals, alerts } = dashboardData

  const usageRate = overview.totalBudget > 0 
    ? ((overview.totalUsed / overview.totalBudget) * 100).toFixed(1) 
    : '0'
  
  // Calculate CAPEX and OPEX from budgetByType
  const capexData = budgetByType.find(b => b.type === 'CAPEX')
  const opexData = budgetByType.find(b => b.type === 'OPEX')
  
  const capexBudget = capexData?.total || 0
  const capexUsed = capexData?.used || 0
  const capexRate = capexBudget > 0 ? ((capexUsed / capexBudget) * 100).toFixed(1) : '0'
  
  const opexBudget = opexData?.total || 0
  const opexUsed = opexData?.used || 0
  const opexRate = opexBudget > 0 ? ((opexUsed / opexBudget) * 100).toFixed(1) : '0'

  // Transform department data for chart
  const deptChartData = budgetByDepartment.map(dept => ({
    name: dept.departmentName,
    budget: dept.total,
    used: dept.used,
    remaining: dept.total - dept.used
  }))

  // Generate monthly trend data (mock for now - can be replaced with actual API)
  const monthlyTrend = [
    { month: '1月', budget: Math.round(overview.totalBudget / 12), actual: Math.round(overview.totalUsed / 8) },
    { month: '2月', budget: Math.round(overview.totalBudget / 12), actual: Math.round(overview.totalUsed / 8) },
    { month: '3月', budget: Math.round(overview.totalBudget / 12), actual: Math.round(overview.totalUsed / 8) },
    { month: '4月', budget: Math.round(overview.totalBudget / 12), actual: Math.round(overview.totalUsed / 8) },
    { month: '5月', budget: Math.round(overview.totalBudget / 12), actual: Math.round(overview.totalUsed / 8) },
    { month: '6月', budget: Math.round(overview.totalBudget / 12), actual: Math.round(overview.totalUsed / 8) },
    { month: '7月', budget: Math.round(overview.totalBudget / 12), actual: Math.round(overview.totalUsed / 8) },
    { month: '8月', budget: Math.round(overview.totalBudget / 12), actual: 0 },
    { month: '9月', budget: Math.round(overview.totalBudget / 12), actual: 0 },
    { month: '10月', budget: Math.round(overview.totalBudget / 12), actual: 0 },
    { month: '11月', budget: Math.round(overview.totalBudget / 12), actual: 0 },
    { month: '12月', budget: Math.round(overview.totalBudget / 12), actual: 0 },
  ]

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

      {/* Alert Cards */}
      {alerts && alerts.length > 0 && (
        <div className="alerts-grid">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert-card alert-${alert.level}`}>
              <AlertTriangle size={20} />
              <div>
                <strong>{alert.type}</strong>: {alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">年度预算总额</div>
          <div className="stat-value">{formatCurrency(overview.totalBudget)}</div>
          <div className="progress mt-4">
            <div className="progress-bar" style={{ width: `${usageRate}%`, background: '#0071e3' }} />
          </div>
          <div className="stat-footer">
            <span>已使用 {usageRate}%</span>
            <span>剩余 {formatCurrency(overview.totalBudget - overview.totalUsed)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Capex 资本性支出</div>
          <div className="stat-value">{formatCurrency(capexBudget)}</div>
          <div className="progress mt-4">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(Number(capexRate), 100)}%`, background: Number(capexRate) > 100 ? '#ff3b30' : '#34c759' }}
            />
          </div>
          <div className="stat-footer">
            <span>已使用 {capexRate}%</span>
            <span>{formatCurrency(capexBudget - capexUsed)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Opex 运营性支出</div>
          <div className="stat-value">{formatCurrency(opexBudget)}</div>
          <div className="progress mt-4">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(Number(opexRate), 100)}%`, background: Number(opexRate) > 100 ? '#ff3b30' : '#34c759' }}
            />
          </div>
          <div className="stat-footer">
            <span>已使用 {opexRate}%</span>
            <span>{formatCurrency(opexBudget - opexUsed)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">待审批</div>
          <div className="stat-value">{overview.pendingApproval}</div>
          <div className="stat-footer">
            <span>预算数量: {overview.budgetCount}</span>
            <span>采购申请: {overview.purchaseCount}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">部门预算执行</h3>
          </div>
          <div className="chart-container">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptChartData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatCurrency} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip formatter={formatCurrency} />
                  <Legend />
                  <Bar dataKey="budget" name="预算" fill="#0071e3" />
                  <Bar dataKey="used" name="已使用" fill="#34c759" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">暂无部门数据</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">预算类型分布</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Capex', value: capexBudget },
                    { name: 'Opex', value: opexBudget },
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#0071e3" />
                  <Cell fill="#34c759" />
                </Pie>
                <Tooltip formatter={formatCurrency} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">月度预算执行趋势</h3>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Bar dataKey="budget" name="预算" fill="#0071e3" />
              <Bar dataKey="actual" name="实际" fill="#34c759" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">各部门预算明细</h3>
          <Link to="/budgets" className="btn btn-secondary">
            查看全部
          </Link>
        </div>
        {deptChartData.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>部门</th>
                <th>预算金额</th>
                <th>已使用</th>
                <th>剩余</th>
                <th>执行率</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {deptChartData.map((dept) => {
                const rate = dept.budget > 0 ? ((dept.used / dept.budget) * 100).toFixed(1) : '0'
                return (
                  <tr key={dept.name}>
                    <td className="font-medium">{dept.name}</td>
                    <td>{formatCurrency(dept.budget)}</td>
                    <td>{formatCurrency(dept.used)}</td>
                    <td>{formatCurrency(dept.remaining)}</td>
                    <td>
                      <div className="progress" style={{ width: '100px' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${Math.min(Number(rate), 100)}%`,
                            background: Number(rate) > 100 ? '#ff3b30' : Number(rate) > 80 ? '#ff9500' : '#34c759',
                          }}
                        />
                      </div>
                      <span className="text-sm ml-2">{rate}%</span>
                    </td>
                    <td>
                      <span
                        className={`tag ${
                          Number(rate) > 100 ? 'tag-danger' : Number(rate) > 80 ? 'tag-warning' : 'tag-success'
                        }`}
                      >
                        {Number(rate) > 100 ? '已超支' : Number(rate) > 80 ? '接近上限' : '正常'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-table">暂无部门预算数据</div>
        )}
      </div>

      {/* Recent Approvals */}
      {recentApprovals && recentApprovals.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">最近审批</h3>
            <Link to="/approvals" className="btn btn-secondary">
              查看全部
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>类型</th>
                <th>标题</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {recentApprovals.map((approval) => (
                <tr key={approval.id}>
                  <td>{approval.type}</td>
                  <td className="font-medium">{approval.title}</td>
                  <td>
                    <span className={`tag tag-${approval.status === 'APPROVED' ? 'success' : approval.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td>{new Date(approval.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
