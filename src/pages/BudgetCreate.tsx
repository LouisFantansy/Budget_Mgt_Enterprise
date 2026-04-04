import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { budgetApi } from '../api/modules/budget.api'
import { departmentApi, DepartmentTreeNode } from '../api/modules/department.api'
import type { CreateBudgetItemRequest } from '../api/types/budget.types'
import type { BudgetType } from '../types'

interface BudgetItem {
  id: string
  name: string
  category: string
  unitPrice: number
  quantity: number
}

export function BudgetCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    type: 'OPEX' as BudgetType,
    year: new Date().getFullYear(),
  })
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', name: '', category: '', unitPrice: 0, quantity: 1 },
  ])

  const categories = ['材料费', '测试费', '租赁费', '差旅费', '咨询费', '设备费', '服务费', '其他']

  // 加载部门列表
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = (await departmentApi.getTree()) as any
        // API 响应解包：体调不一致，统一处理
        const deptData = response?.data?.data || response?.data || []
        if (Array.isArray(deptData)) {
          setDepartments(deptData)
        }
      } catch (err) {
        console.error('加载部门失败:', err)
        setDepartments([])
      }
    }
    fetchDepartments()
  }, [])

  // 扁平化部门列表
  const flattenDepartments = (depts: DepartmentTreeNode[], level: number = 0): { id: string; name: string; level: number }[] => {
    return depts.flatMap(dept => [
      { id: dept.id, name: dept.name, level },
      ...(dept.children ? flattenDepartments(dept.children, level + 1) : [])
    ])
  }

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', category: '', unitPrice: 0, quantity: 1 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证明细
    const validItems = items.filter(item => item.name && item.unitPrice > 0)
    if (validItems.length === 0) {
      alert('请至少添加一条有效的预算明细')
      return
    }

    setLoading(true)
    try {
      const budgetItems: CreateBudgetItemRequest[] = validItems.map(item => ({
        name: item.name,
        category: item.category || '其他',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }))

      await budgetApi.create({
        name: formData.name,
        departmentId: formData.departmentId,
        type: formData.type,
        year: formData.year,
        items: budgetItems,
      })
      
      alert('预算创建成功')
      navigate('/budgets')
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const totalBudget = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity || 0), 0)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

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
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
              >
                <option value="">请选择部门</option>
                {flattenDepartments(departments).map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {'　'.repeat(dept.level)}{dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">预算类型 *</label>
              <select
                className="select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as BudgetType })}
              >
                <option value="OPEX">OPEX - 运营性支出</option>
                <option value="CAPEX">CAPEX - 资本性支出</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">年度 *</label>
              <select
                className="select"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
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
                <th>单价（元）</th>
                <th>数量</th>
                <th>小计</th>
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
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{ width: '120px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      min="1"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    ¥{((item.unitPrice || 0) * (item.quantity || 0)).toLocaleString()}
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
                <td colSpan={4} className="text-right font-bold">
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 处理中...
              </>
            ) : (
              <>
                <Save size={16} /> 保存为草稿
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
