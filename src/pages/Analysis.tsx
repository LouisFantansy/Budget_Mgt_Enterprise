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

// Mock analysis data
const mockDepartmentAnalysis = [
  { name: '研发部', budget: 15000000, actual: 12000000, variance: -3000000, varianceRate: -20 },
  { name: '生产部', budget: 12000000, actual: 9000000, variance: -3000000, varianceRate: -25 },
  { name: '采购部', budget: 8000000, actual: 6000000, variance: -2000000, varianceRate: -25 },
  { name: '质量部', budget: 6000000, actual: 3000000, variance: -3000000, varianceRate: -50 },
  { name: 'IT部', budget: 5000000, actual: 2500000, variance: -2500000, varianceRate: -50 },
  { name: '行政部', budget: 4000000, actual: 1500000, variance: -2500000, varianceRate: -62.5 },
]

const mockMonthlyAnalysis = [
  { month: '1月', budget: 4000000, actual: 3500000, variance: -500000 },
  { month: '2月', budget: 4200000, actual: 4000000, variance: -200000 },
  { month: '3月', budget: 4500000, actual: 4800000, variance: 300000 },
  { month: '4月', budget: 4000000, actual: 3500000, variance: -500000 },
  { month: '5月', budget: 4200000, actual: 4200000, variance: 0 },
  { month: '6月', budget: 4500000, actual: 5000000, variance: 500000 },
  { month: '7月', budget: 4500000, actual: 4200000, variance: -300000 },
  { month: '8月', budget: 4800000, actual: 4500000, variance: -300000 },
]

export function Analysis() {
  // Placeholder for dimension selection

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 10000) return `¥${(value / 10000).toFixed(0)}万`
    return `¥${value.toFixed(0)}`
  }

  const totalBudget = mockDepartmentAnalysis.reduce((sum, d) => sum + d.budget, 0)
  const totalActual = mockDepartmentAnalysis.reduce((sum, d) => sum + d.actual, 0)
  const totalVariance = totalActual - totalBudget

  return (
    <div className="analysis-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">差异分析</h1>
          <p className="page-subtitle">预算执行差异分析报告</p>
        </div>
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
          <div className="stat-value">{((totalActual / totalBudget) * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">部门维度分析</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockDepartmentAnalysis} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="name" width={60} />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Bar dataKey="budget" name="预算" fill="#0071e3" />
                <Bar dataKey="actual" name="实际" fill="#34c759" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">差异趋势分析</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockMonthlyAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Line type="monotone" dataKey="budget" name="预算" stroke="#0071e3" />
                <Line type="monotone" dataKey="actual" name="实际" stroke="#34c759" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">差异明细</h3>
        </div>
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
            {mockDepartmentAnalysis.map((dept) => (
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
                  ) : (
                    <span className="tag tag-warning">超支</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}