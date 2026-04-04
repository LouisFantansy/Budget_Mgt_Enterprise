import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react'
import { purchaseApi } from '../api/modules/purchase.api'
import { budgetApi } from '../api/modules/budget.api'

interface BudgetItem {
  id: string
  code: string
  name: string
  balance: number
}

export function PurchaseRequestCreate() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    budgetId: '',
    budgetItem: '',
    itemName: '',
    specification: '',
    quantity: 1,
    unitPrice: 0,
    purpose: '',
  })
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const response = (await budgetApi.getList({ page: 1, pageSize: 100, status: 'APPROVED' as any })) as any
      // API 响应解包：统一处理响应格式
      const responseData = response?.data?.data || response?.data || {}
      const items = responseData?.items || []
      // 转换为 BudgetItem 格式
      const formattedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
        id: item.id,
        code: item.budgetNo || item.code,
        name: item.name,
        balance: Number(item.totalAmount) - Number(item.usedAmount || 0),
      }))
      setBudgetItems(formattedItems)
    } catch (err) {
      console.error('Failed to fetch budgets:', err)
      setBudgetItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await purchaseApi.create({
        budgetId: formData.budgetId,
        items: [{
          name: formData.itemName,
          specification: formData.specification,
          quantity: formData.quantity,
          unitPrice: formData.unitPrice,
        }],
        purpose: formData.purpose,
        urgencyLevel: 'NORMAL' as any,
      })
      alert('采购申请创建成功')
      navigate('/purchase')
    } catch (err: any) {
      console.error('Failed to create purchase request:', err)
      alert(err.response?.data?.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    // 保存草稿逻辑类似，但可以先不提交审批
    alert('草稿保存功能待实现')
  }

  const totalAmount = formData.quantity * formData.unitPrice

  const selectedBudget = budgetItems.find(b => b.code === formData.budgetItem)

  if (loading) {
    return (
      <div className="purchase-create-page">
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p>加载预算数据...</p>
        </div>
      </div>
    )
  }

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
              onChange={(e) => {
                const selected = budgetItems.find(b => b.code === e.target.value)
                setFormData({ 
                  ...formData, 
                  budgetItem: e.target.value,
                  budgetId: selected?.id || ''
                })
              }}
              required
            >
              <option value="">请选择预算条目</option>
              {budgetItems.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.code} - {item.name} (余额：¥{(item.balance / 10000).toFixed(2)}万)
                </option>
              ))}
            </select>
            {formData.budgetItem && (
              <div className="budget-info">
                <span className="info-badge">预算充足</span>
                <span className="text-secondary">可用余额：¥{(selectedBudget?.balance || 0).toLocaleString()}</span>
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
          <button type="button" className="btn btn-primary" onClick={handleSaveDraft} disabled={submitting}>
            <Save size={16} /> 保存草稿
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Loader2 className="spinner" size={16} /> : <Send size={16} />}
            {submitting ? ' 提交中...' : ' 提交申请'}
          </button>
        </div>
      </form>
    </div>
  )
}