import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Send, CheckCircle, XCircle } from 'lucide-react'

// Mock budget detail
const mockBudgetDetail = {
  id: '1',
  name: '2024年度研发部预算',
  department: '研发部',
  type: 'Opex',
  budget: 15000000,
  used: 12000000,
  remaining: 3000000,
  status: 'approved',
  year: 2024,
  createdAt: '2024-01-15',
  updatedAt: '2024-06-20',
  items: [
    { id: '1', name: '研发材料', budget: 8000000, used: 6500000, category: '材料费' },
    { id: '2', name: '测试费用', budget: 4000000, used: 3500000, category: '测试费' },
    { id: '3', name: '设备租赁', budget: 2000000, used: 1500000, category: '租赁费' },
    { id: '4', name: '差旅费', budget: 1000000, used: 500000, category: '差旅费' },
  ],
  approvals: [
    { step: 1, role: '部门负责人', user: '李部门', status: 'approved', date: '2024-01-20', comment: '同意' },
    { step: 2, role: '预算管理员', user: '张预算', status: 'approved', date: '2024-01-22', comment: '预算合理，同意' },
    { step: 3, role: '财务', user: '王财务', status: 'approved', date: '2024-01-25', comment: '符合财务规范' },
    { step: 4, role: '总经理', user: '赵总', status: 'approved', date: '2024-01-28', comment: '批准执行' },
  ],
}

export function BudgetDetail() {
  const { id } = useParams()
  const [budget] = useState(mockBudgetDetail)

  const formatCurrency = (value: number) => {
    return `¥${(value / 10000).toFixed(0)}万`
  }

  const usageRate = ((budget.used / budget.budget) * 100).toFixed(1)

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
          <Link to={`/budgets/${id}/adjust`} className="btn btn-secondary">
            <Edit size={16} /> 调整预算
          </Link>
          {budget.status === 'draft' && (
            <button className="btn btn-primary">
              <Send size={16} /> 提交审批
            </button>
          )}
        </div>
      </div>

      {/* Status & Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">预算金额</div>
          <div className="stat-value">{formatCurrency(budget.budget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已使用</div>
          <div className="stat-value">{formatCurrency(budget.used)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">剩余</div>
          <div className="stat-value">{formatCurrency(budget.remaining)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">执行率</div>
          <div className="stat-value">{usageRate}%</div>
          <div className="progress mt-4">
            <div
              className="progress-bar"
              style={{
                width: `${usageRate}%`,
                background: Number(usageRate) > 100 ? '#ff3b30' : Number(usageRate) > 80 ? '#ff9500' : '#34c759',
              }}
            />
          </div>
        </div>
      </div>

      {/* Budget Items */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">预算明细</h3>
        </div>
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
            {budget.items.map((item) => {
              const rate = ((item.used / item.budget) * 100).toFixed(1)
              return (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.category}</td>
                  <td>{formatCurrency(item.budget)}</td>
                  <td>{formatCurrency(item.used)}</td>
                  <td>{formatCurrency(item.budget - item.used)}</td>
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
      </div>

      {/* Approval History */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">审批记录</h3>
        </div>
        <div className="approval-timeline">
          {budget.approvals.map((approval, index) => (
            <div key={index} className="approval-step">
              <div className={`approval-icon ${approval.status}`}>
                {approval.status === 'approved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </div>
              <div className="approval-content">
                <div className="approval-header">
                  <span className="approval-role">{approval.role}</span>
                  <span className="approval-user">{approval.user}</span>
                </div>
                <div className="approval-comment">{approval.comment}</div>
                <div className="approval-date">{approval.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}