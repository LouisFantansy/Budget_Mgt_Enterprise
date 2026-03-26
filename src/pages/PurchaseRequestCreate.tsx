import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send } from 'lucide-react'

export function PurchaseRequestCreate() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    budgetItem: '',
    itemName: '',
    specification: '',
    quantity: 1,
    unitPrice: 0,
    purpose: '',
  })

  const mockBudgetItems = [
    { id: '1', code: 'BUD-2024-001', name: '测试晶圆', balance: 500000 },
    { id: '2', code: 'BUD-2024-002', name: '测试设备', balance: 800000 },
    { id: '3', code: 'BUD-2024-003', name: '研发材料', balance: 300000 },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Creating purchase request:', formData)
    // In production, save to backend
    navigate('/purchase')
  }

  const totalAmount = formData.quantity * formData.unitPrice

  return (
    <div className="purchase-create-page">
      <div className="page-header">
        <div>
          <Link to="/purchase" className="back-link">
            <ArrowLeft size={16} /> 返回列表
          </Link>
          <h1 className="page-title">新建采购申请</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Budget Selection */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">选择预算条目</h3>
          </div>
          <div className="input-group">
            <label className="input-label">关联预算编号 *</label>
            <select
              className="select"
              value={formData.budgetItem}
              onChange={(e) => setFormData({ ...formData, budgetItem: e.target.value })}
              required
            >
              <option value="">请选择预算条目</option>
              {mockBudgetItems.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.code} - {item.name} (余额：¥{(item.balance / 10000).toFixed(2)}万)
                </option>
              ))}
            </select>
            {formData.budgetItem && (
              <div className="budget-info">
                <span className="info-badge">预算充足</span>
                <span className="text-secondary">可用余额：¥{(mockBudgetItems.find(i => i.code === formData.budgetItem)?.balance || 0).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Details */}
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">采购明细</h3>
          </div>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">采购物品名称 *</label>
              <input
                type="text"
                className="input"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="请输入物品名称"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">规格型号 *</label>
              <input
                type="text"
                className="input"
                value={formData.specification}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                placeholder="请输入规格型号"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">数量 *</label>
              <input
                type="number"
                className="input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                min="1"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">单价（元） *</label>
              <input
                type="number"
                className="input"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="input-group full-width">
              <label className="input-label">用途说明 *</label>
              <textarea
                className="input"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="请详细说明采购用途和使用计划"
                rows={4}
                required
              />
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">金额汇总</h3>
          </div>
          <div className="amount-summary">
            <div className="amount-row">
              <span className="amount-label">合计金额：</span>
              <span className="amount-value">¥{totalAmount.toLocaleString()}</span>
            </div>
            <div className="amount-row">
              <span className="amount-label">大写金额：</span>
              <span className="amount-value text-secondary">人民币{totalAmount}元整</span>
            </div>
          </div>
        </div>

        {/* Approval Flow Preview */}
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">审批流程预览</h3>
          </div>
          <div className="approval-preview">
            <div className="flow-step">
              <div className="step-number">1</div>
              <div className="step-text">需求人提交</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-number">2</div>
              <div className="step-text">部门负责人审批</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-number">3</div>
              <div className="step-text">预算管理员审批</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-number">4</div>
              <div className="step-text">财务审批</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-number">5</div>
              <div className="step-text">采购部执行</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions mt-4">
          <Link to="/purchase" className="btn btn-secondary">
            取消
          </Link>
          <button type="button" className="btn btn-primary">
            <Save size={16} /> 保存草稿
          </button>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> 提交申请
          </button>
        </div>
      </form>
    </div>
  )
}