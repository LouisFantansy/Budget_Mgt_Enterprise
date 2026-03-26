import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

interface BudgetItem {
  id: string
  name: string
  category: string
  budget: number
}

export function BudgetCreate() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    type: 'Opex',
    year: new Date().getFullYear(),
    status: 'draft',
  })
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', name: '', category: '', budget: 0 },
  ])

  const departments = ['研发部', '生产部', '采购部', '质量部', 'IT部', '行政部']
  const categories = ['材料费', '测试费', '租赁费', '差旅费', '咨询费', '设备费']

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', category: '', budget: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would save to the backend
    console.log('Saving budget:', { ...formData, items })
    navigate('/budgets')
  }

  const totalBudget = items.reduce((sum, item) => sum + (item.budget || 0), 0)

  return (
    <div className="budget-create">
      <div className="page-header">
        <div>
          <Link to="/budgets" className="back-link">
            <ArrowLeft size={16} /> 返回列表
          </Link>
          <h1 className="page-title">新建预算</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">基本信息</h3>
          </div>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">预算名称 *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：2024年度研发部预算"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">所属部门 *</label>
              <select
                className="select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              >
                <option value="">请选择部门</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">预算类型 *</label>
              <select
                className="select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Opex">Opex - 运营性支出</option>
                <option value="Capex">Capex - 资本性支出</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">年度 *</label>
              <select
                className="select"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">预算明细</h3>
            <button type="button" className="btn btn-secondary" onClick={addItem}>
              <Plus size={16} /> 添加项目
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>项目名称</th>
                <th>类别</th>
                <th>预算金额</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      className="input"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="例如：研发材料"
                      style={{ width: '200px' }}
                    />
                  </td>
                  <td>
                    <select
                      className="select"
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      style={{ width: '150px' }}
                    >
                      <option value="">请选择</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      value={item.budget || ''}
                      onChange={(e) => updateItem(item.id, 'budget', Number(e.target.value))}
                      placeholder="0"
                      style={{ width: '150px' }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="text-right font-bold">
                  预算合计：
                </td>
                <td className="font-bold">¥{totalBudget.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="form-actions mt-4">
          <Link to="/budgets" className="btn btn-secondary">
            取消
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> 保存为草稿
          </button>
        </div>
      </form>
    </div>
  )
}