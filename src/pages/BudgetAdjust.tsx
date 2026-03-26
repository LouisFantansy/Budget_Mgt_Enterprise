import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'

// Mock budget data
const mockBudget = {
  id: '1',
  name: '2024年度研发部预算',
  department: '研发部',
  type: 'Opex',
  budget: 15000000,
  used: 12000000,
  remaining: 3000000,
}

export function BudgetAdjust() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [adjustment, setAdjustment] = useState({
    reason: '',
    items: [
      { name: '研发材料', original: 8000000, adjusted: 8000000, reason: '' },
      { name: '测试费用', original: 4000000, adjusted: 4000000, reason: '' },
      { name: '设备租赁', original: 2000000, adjusted: 2000000, reason: '' },
      { name: '差旅费', original: 1000000, adjusted: 1000000, reason: '' },
    ],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would submit the adjustment
    console.log('Submitting adjustment:', adjustment)
    navigate(`/budgets/${id}`)
  }

  const totalOriginal = adjustment.items.reduce((sum, item) => sum + item.original, 0)
  const totalAdjusted = adjustment.items.reduce((sum, item) => sum + item.adjusted, 0)
  const difference = totalAdjusted - totalOriginal

  return (
    <div className="budget-adjust">
      <div className="page-header">
        <div>
          <Link to={`/budgets/${id}`} className="back-link">
            <ArrowLeft size={16} /> 返回详情
          </Link>
          <h1 className="page-title">调整预算</h1>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">原预算信息</h3>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">预算名称</span>
            <span className="info-value">{mockBudget.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">部门</span>
            <span className="info-value">{mockBudget.department}</span>
          </div>
          <div className="info-item">
            <span className="info-label">当前预算</span>
            <span className="info-value">¥{totalOriginal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">调整明细</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>项目</th>
                <th>原金额</th>
                <th>调整后金额</th>
                <th>调整原因</th>
              </tr>
            </thead>
            <tbody>
              {adjustment.items.map((item, index) => (
                <tr key={index}>
                  <td className="font-medium">{item.name}</td>
                  <td>¥{item.original.toLocaleString()}</td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      value={item.adjusted}
                      onChange={(e) => {
                        const newItems = [...adjustment.items]
                        newItems[index].adjusted = Number(e.target.value)
                        setAdjustment({ ...adjustment, items: newItems })
                      }}
                      style={{ width: '150px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input"
                      value={item.reason}
                      onChange={(e) => {
                        const newItems = [...adjustment.items]
                        newItems[index].reason = e.target.value
                        setAdjustment({ ...adjustment, items: newItems })
                      }}
                      placeholder="请输入调整原因"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold">合计</td>
                <td className="font-bold">¥{totalOriginal.toLocaleString()}</td>
                <td className="font-bold">¥{totalAdjusted.toLocaleString()}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={2} className="text-right">调整金额：</td>
                <td className={`font-bold ${difference >= 0 ? 'text-success' : 'text-danger'}`}>
                  {difference >= 0 ? '+' : ''}¥{difference.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">调整说明</h3>
          </div>
          <div className="input-group">
            <label className="input-label">调整原因 *</label>
            <textarea
              className="input"
              value={adjustment.reason}
              onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
              placeholder="请详细说明本次预算调整的原因..."
              rows={4}
              required
            />
          </div>
        </div>

        <div className="form-actions mt-4">
          <Link to={`/budgets/${id}`} className="btn btn-secondary">
            取消
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> 提交调整
          </button>
        </div>
      </form>
    </div>
  )
}