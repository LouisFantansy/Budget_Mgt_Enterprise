import { useState } from 'react'
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
import { AlertTriangle, ArrowRight } from 'lucide-react'

// Mock data
const mockBudgetSummary = {
  totalBudget: 50000000,
  used: 32500000,
  remaining: 17500000,
  capexBudget: 30000000,
  capexUsed: 22000000,
  opexBudget: 20000000,
  opexUsed: 10500000,
}

const mockDepartmentData = [
  { name: '研发部', budget: 15000000, used: 12000000, remaining: 3000000 },
  { name: '生产部', budget: 12000000, used: 9000000, remaining: 3000000 },
  { name: '采购部', budget: 8000000, used: 6000000, remaining: 2000000 },
  { name: '质量部', budget: 6000000, used: 3000000, remaining: 3000000 },
  { name: 'IT部', budget: 5000000, used: 2500000, remaining: 2500000 },
  { name: '行政部', budget: 4000000, used: 1500000, remaining: 2500000 },
]

const mockMonthlyTrend = [
  { month: '1月', budget: 4000000, actual: 3500000 },
  { month: '2月', budget: 4200000, actual: 4000000 },
  { month: '3月', budget: 4500000, actual: 4800000 },
  { month: '4月', budget: 4000000, actual: 3500000 },
  { month: '5月', budget: 4200000, actual: 4200000 },
  { month: '6月', budget: 4500000, actual: 5000000 },
  { month: '7月', budget: 4500000, actual: 4200000 },
  { month: '8月', budget: 4800000, actual: 4500000 },
  { month: '9月', budget: 5000000, actual: 0 },
  { month: '10月', budget: 5000000, actual: 0 },
  { month: '11月', budget: 5200000, actual: 0 },
  { month: '12月', budget: 5500000, actual: 0 },
]

const mockAlerts = [
  { id: 1, type: 'warning', department: '研发部', message: '研发材料预算执行率已达85%', budgetId: '1' },
  { id: 2, type: 'danger', department: '生产部', message: '生产设备维护预算已超支5%', budgetId: '2' },
  { id: 3, type: 'info', department: '采购部', message: 'Q3采购预算待审批', budgetId: '3' },
]

export function Dashboard() {
  const [summary] = useState(mockBudgetSummary)
  const [deptData] = useState(mockDepartmentData)
  const [trend] = useState(mockMonthlyTrend)
  const [alerts] = useState(mockAlerts)

  const usageRate = ((summary.used / summary.totalBudget) * 100).toFixed(1)
  const capexRate = ((summary.capexUsed / summary.capexBudget) * 100).toFixed(1)
  const opexRate = ((summary.opexUsed / summary.opexBudget) * 100).toFixed(1)

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `¥${(value / 10000000).toFixed(1)}M`
    if (value >= 10000) return `¥${(value / 10000).toFixed(0)}K`
    return `¥${value.toFixed(0)}`
  }

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
      {alerts.length > 0 && (
        <div className="alerts-grid">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-card alert-${alert.type}`}>
              <AlertTriangle size={20} />
              <div>
                <strong>{alert.department}</strong>: {alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">年度预算总额</div>
          <div className="stat-value">{formatCurrency(summary.totalBudget)}</div>
          <div className="progress mt-4">
            <div className="progress-bar" style={{ width: `${usageRate}%`, background: '#0071e3' }} />
          </div>
          <div className="stat-footer">
            <span>已使用 {usageRate}%</span>
            <span>剩余 {formatCurrency(summary.remaining)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Capex 资本性支出</div>
          <div className="stat-value">{formatCurrency(summary.capexBudget)}</div>
          <div className="progress mt-4">
            <div
              className="progress-bar"
              style={{ width: `${capexRate}%`, background: Number(capexRate) > 100 ? '#ff3b30' : '#34c759' }}
            />
          </div>
          <div className="stat-footer">
            <span>已使用 {capexRate}%</span>
            <span>{formatCurrency(summary.capexBudget - summary.capexUsed)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Opex 运营性支出</div>
          <div className="stat-value">{formatCurrency(summary.opexBudget)}</div>
          <div className="progress mt-4">
            <div
              className="progress-bar"
              style={{ width: `${opexRate}%`, background: Number(opexRate) > 100 ? '#ff3b30' : '#34c759' }}
            />
          </div>
          <div className="stat-footer">
            <span>已使用 {opexRate}%</span>
            <span>{formatCurrency(summary.opexBudget - summary.opexUsed)}</span>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="name" width={60} />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Bar dataKey="budget" name="预算" fill="#0071e3" />
                <Bar dataKey="used" name="已使用" fill="#34c759" />
              </BarChart>
            </ResponsiveContainer>
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
                    { name: 'Capex', value: summary.capexBudget },
                    { name: 'Opex', value: summary.opexBudget },
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
            <BarChart data={trend}>
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
            {deptData.map((dept) => {
              const rate = ((dept.used / dept.budget) * 100).toFixed(1)
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
                          width: `${rate}%`,
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
      </div>
    </div>
  )
}