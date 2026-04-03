import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { reportApi } from '../api/modules/report.api'
import type { DepartmentRankingItem, MonthlyTrendItem, CategoryAnalysisItem } from '../api/modules/report.api'

export function Analysis() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departmentRanking, setDepartmentRanking] = useState<DepartmentRankingItem[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendItem[]>([])
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysisItem[]>([])
  
  // Filter states
  const [year] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [rankingRes, trendRes, categoryRes] = await Promise.all([
          reportApi.getDepartmentRanking({ year }),
          reportApi.getMonthlyTrend({ year }),
          reportApi.getCategoryAnalysis({ year }),
        ])
        
        setDepartmentRanking(rankingRes.data)
        setMonthlyTrend(trendRes.data)
        setCategoryAnalysis(categoryRes.data)
      } catch (err: any) {
        console.error('Failed to fetch analysis data:', err)
        setError(err.response?.data?.message || '获取分析数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 10000) return `¥${(value / 10000).toFixed(0)}万`
    return `¥${value.toFixed(0)}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="analysis-page">
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
      <div className="analysis-page">
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

  // Transform data for charts
  const departmentAnalysis = departmentRanking.map(dept => ({
    name: dept.departmentName,
    budget: dept.totalBudget,
    actual: dept.totalUsed,
    variance: dept.totalUsed - dept.totalBudget,
    varianceRate: dept.totalBudget > 0 
      ? Number((((dept.totalUsed - dept.totalBudget) / dept.totalBudget) * 100).toFixed(1))
      : 0,
  }))

  const monthlyAnalysis = monthlyTrend.map(month => ({
    month: month.month,
    budget: month.budget,
    actual: month.used,
    variance: month.used - month.budget,
    purchase: month.purchase,
  }))

  const totalBudget = departmentAnalysis.reduce((sum, d) => sum + d.budget, 0)
  const totalActual = departmentAnalysis.reduce((sum, d) => sum + d.actual, 0)
  const totalVariance = totalActual - totalBudget

  return (
    <div className="analysis-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">差异分析</h1>
          <p className="page-subtitle">预算执行差异分析报告</p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => reportApi.exportAnalysis({ year })}
        >
          导出报表
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">总预算</div>
          <div className="stat-value">{formatCurrency(totalBudget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">实际支出</div>
          <div className="stat-value">{formatCurrency(totalActual)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">差异</div>
          <div className={`stat-value ${totalVariance < 0 ? 'text-success' : 'text-danger'}`}>
            {totalVariance < 0 ? '-' : '+'}{formatCurrency(Math.abs(totalVariance))}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">执行率</div>
          <div className="stat-value">
            {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">部门维度分析</h3>
          </div>
          <div className="chart-container">
            {departmentAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentAnalysis} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatCurrency} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip formatter={formatCurrency} />
                  <Legend />
                  <Bar dataKey="budget" name="预算" fill="#0071e3" />
                  <Bar dataKey="actual" name="实际" fill="#34c759" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">暂无部门分析数据</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">差异趋势分析</h3>
          </div>
          <div className="chart-container">
            {monthlyAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={formatCurrency} />
                  <Legend />
                  <Line type="monotone" dataKey="budget" name="预算" stroke="#0071e3" />
                  <Line type="monotone" dataKey="actual" name="实际" stroke="#34c759" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">暂无月度趋势数据</div>
            )}
          </div>
        </div>
      </div>

      {/* Category Analysis */}
      {categoryAnalysis.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">分类分析</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>分类</th>
                <th>预算金额</th>
                <th>已使用</th>
                <th>执行率</th>
                <th>项目数</th>
              </tr>
            </thead>
            <tbody>
              {categoryAnalysis.map((cat) => (
                <tr key={cat.category}>
                  <td className="font-medium">{cat.category}</td>
                  <td>{formatCurrency(cat.totalBudget)}</td>
                  <td>{formatCurrency(cat.totalUsed)}</td>
                  <td>
                    <div className="progress" style={{ width: '100px' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${Math.min(cat.usedPercent, 100)}%`,
                          background: cat.usedPercent > 100 ? '#ff3b30' : cat.usedPercent > 80 ? '#ff9500' : '#34c759',
                        }}
                      />
                    </div>
                    <span className="text-sm ml-2">{cat.usedPercent.toFixed(1)}%</span>
                  </td>
                  <td>{cat.itemCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">差异明细</h3>
        </div>
        {departmentAnalysis.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>部门</th>
                <th>预算</th>
                <th>实际</th>
                <th>差异</th>
                <th>差异率</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {departmentAnalysis.map((dept) => (
                <tr key={dept.name}>
                  <td className="font-medium">{dept.name}</td>
                  <td>{formatCurrency(dept.budget)}</td>
                  <td>{formatCurrency(dept.actual)}</td>
                  <td className={dept.variance < 0 ? 'text-success' : 'text-danger'}>
                    {dept.variance < 0 ? '-' : '+'}{formatCurrency(Math.abs(dept.variance))}
                  </td>
                  <td>
                    <span className={`tag ${dept.varianceRate <= -20 ? 'tag-success' : 'tag-warning'}`}>
                      {dept.varianceRate}%
                    </span>
                  </td>
                  <td>
                    {dept.varianceRate <= -20 ? (
                      <span className="tag tag-success">节约</span>
                    ) : dept.varianceRate > 0 ? (
                      <span className="tag tag-danger">超支</span>
                    ) : (
                      <span className="tag tag-warning">正常</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-table">暂无差异明细数据</div>
        )}
      </div>
    </div>
  )
}
