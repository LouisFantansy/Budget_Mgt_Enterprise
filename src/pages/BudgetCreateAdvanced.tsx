import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Send, Copy, Loader2 } from 'lucide-react'
import { budgetApi } from '../api/modules/budget.api'
import { departmentApi, DepartmentTreeNode } from '../api/modules/department.api'
import type { CreateBudgetItemRequest } from '../api/types/budget.types'
import type { BudgetType } from '../types'

interface BudgetItemDetail {
  id: string
  deptLevel1: string
  deptLevel2: string
  deptLevel3: string
  category: string
  name: string
  specification: string
  functionDesc: string
  unitPrice: number
  quantity: number
  monthlyQuantity: number[]
  project: string
  purpose: string
  supplier: string
  deliveryDate: string
}

export function BudgetCreateAdvanced() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([])
  
  const [formData, setFormData] = useState({
    departmentId: '',
    type: 'OPEX' as BudgetType,
    year: new Date().getFullYear(),
    remark: '',
  })

  const [items, setItems] = useState<BudgetItemDetail[]>([
    {
      id: '1',
      deptLevel1: '',
      deptLevel2: '',
      deptLevel3: '',
      category: '',
      name: '',
      specification: '',
      functionDesc: '',
      unitPrice: 0,
      quantity: 0,
      monthlyQuantity: Array(12).fill(0),
      project: '',
      purpose: '',
      supplier: '',
      deliveryDate: '',
    },
  ])

  const categories = ['材料费', '测试费', '设备费', '租赁费', '差旅费', '咨询费', '服务费', '其他']

  // 加载部门列表
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true)
      try {
        const response = await departmentApi.getTree()
        if (response.data) {
          setDepartments(response.data)
        }
      } catch (err) {
        console.error('加载部门失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDepartments()
  }, [])

  const addItem = () => {
    const newItem: BudgetItemDetail = {
      id: Date.now().toString(),
      deptLevel1: '',
      deptLevel2: '',
      deptLevel3: '',
      category: '',
      name: '',
      specification: '',
      functionDesc: '',
      unitPrice: 0,
      quantity: 0,
      monthlyQuantity: Array(12).fill(0),
      project: '',
      purpose: '',
      supplier: '',
      deliveryDate: '',
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof BudgetItemDetail, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleSaveDraft = async () => {
    if (!formData.departmentId) {
      alert('请选择编制部门')
      return
    }
    
    const validItems = items.filter(item => item.name && item.unitPrice > 0)
    if (validItems.length === 0) {
      alert('请至少添加一条有效的预算明细')
      return
    }

    setSubmitting(true)
    try {
      const budgetItems: CreateBudgetItemRequest[] = validItems.map(item => ({
        name: item.name,
        category: item.category || '其他',
        specification: item.specification,
        function: item.functionDesc,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        monthlyPlan: item.monthlyQuantity.reduce((acc, qty, idx) => {
          if (qty > 0) acc[(idx + 1).toString()] = qty
          return acc
        }, {} as Record<string, number>),
        project: item.project,
        purpose: item.purpose,
        supplier: item.supplier,
        deliveryDate: item.deliveryDate || undefined,
      }))

      await budgetApi.create({
        name: `${formData.year}年度预算`,
        departmentId: formData.departmentId,
        type: formData.type,
        year: formData.year,
        items: budgetItems,
        remark: formData.remark,
      })
      
      alert('草稿保存成功')
      navigate('/budgets')
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitApproval = async () => {
    if (!formData.departmentId) {
      alert('请选择编制部门')
      return
    }
    
    const validItems = items.filter(item => item.name && item.unitPrice > 0)
    if (validItems.length === 0) {
      alert('请至少添加一条有效的预算明细')
      return
    }

    setSubmitting(true)
    try {
      const budgetItems: CreateBudgetItemRequest[] = validItems.map(item => ({
        name: item.name,
        category: item.category || '其他',
        specification: item.specification,
        function: item.functionDesc,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        monthlyPlan: item.monthlyQuantity.reduce((acc, qty, idx) => {
          if (qty > 0) acc[(idx + 1).toString()] = qty
          return acc
        }, {} as Record<string, number>),
        project: item.project,
        purpose: item.purpose,
        supplier: item.supplier,
        deliveryDate: item.deliveryDate || undefined,
      }))

      const response = await budgetApi.create({
        name: `${formData.year}年度预算`,
        departmentId: formData.departmentId,
        type: formData.type,
        year: formData.year,
        items: budgetItems,
        remark: formData.remark,
      })
      
      // 提交审批
      const budgetData = response.data?.data || response.data
      if (budgetData) {
        await budgetApi.submitForApproval(budgetData.id)
      }
      
      alert('提交审批成功')
      navigate('/budgets')
    } catch (err: any) {
      alert(err.response?.data?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

  // 扁平化部门列表
  const flattenDepartments = (depts: DepartmentTreeNode[], level: number = 0): { id: string; name: string; level: number }[] => {
    return depts.flatMap(dept => [
      { id: dept.id, name: dept.name, level },
      ...(dept.children ? flattenDepartments(dept.children, level + 1) : [])
    ])
  }

  return (
    <div className="budget-create-advanced">
      <div className="page-header">
        <div>
          <Link to="/budgets" className="back-link">
            <ArrowLeft size={16} /> 返回列表
          </Link>
          <h1 className="page-title">编制预算</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Copy size={16} /> 复制模板
          </button>
          <button className="btn btn-primary" onClick={handleSaveDraft} disabled={submitting}>
            {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} 保存草稿
          </button>
          <button className="btn btn-primary" onClick={handleSubmitApproval} disabled={submitting}>
            {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} 提交审批
          </button>
        </div>
      </div>

      {/* Budget Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">基本信息</h3>
        </div>
        <div className="form-grid">
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
          <div className="input-group">
            <label className="input-label">编制部门 *</label>
            <select 
              className="select"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
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
            <label className="input-label">版本</label>
            <input type="text" className="input" value="V1.0 - 草稿" readOnly />
          </div>
        </div>
      </div>

      {/* Budget Items Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">预算明细（{formData.type}）</h3>
          <button type="button" className="btn btn-secondary" onClick={addItem}>
            <Plus size={16} /> 添加条目
          </button>
        </div>

        <div className="budget-table-container">
          <table className="budget-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: 120 }}>一级部门</th>
                <th rowSpan={2} style={{ width: 120 }}>二级部门</th>
                <th rowSpan={2} style={{ width: 120 }}>三级部门</th>
                <th rowSpan={2} style={{ width: 100 }}>类别</th>
                <th rowSpan={2} style={{ width: 150 }}>采购名称</th>
                <th rowSpan={2} style={{ width: 120 }}>规格型号</th>
                <th rowSpan={2} style={{ width: 120 }}>功能描述</th>
                <th rowSpan={2} style={{ width: 80 }}>单价</th>
                <th rowSpan={2} style={{ width: 80 }}>数量</th>
                <th colSpan={12}>每月数量</th>
                <th rowSpan={2} style={{ width: 100 }}>年度总额</th>
                <th rowSpan={2} style={{ width: 80 }}>操作</th>
              </tr>
              <tr>
                <th style={{ width: 60 }}>1月</th>
                <th style={{ width: 60 }}>2月</th>
                <th style={{ width: 60 }}>3月</th>
                <th style={{ width: 60 }}>4月</th>
                <th style={{ width: 60 }}>5月</th>
                <th style={{ width: 60 }}>6月</th>
                <th style={{ width: 60 }}>7月</th>
                <th style={{ width: 60 }}>8月</th>
                <th style={{ width: 60 }}>9月</th>
                <th style={{ width: 60 }}>10月</th>
                <th style={{ width: 60 }}>11月</th>
                <th style={{ width: 60 }}>12月</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <select
                      className="select-mini"
                      value={item.deptLevel1}
                      onChange={(e) => updateItem(item.id, 'deptLevel1', e.target.value)}
                    >
                      <option value="">请选择</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-mini"
                      value={item.deptLevel2}
                      onChange={(e) => updateItem(item.id, 'deptLevel2', e.target.value)}
                    >
                      <option value="">请选择</option>
                      {departments.find(d => d.name === item.deptLevel1)?.children?.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-mini"
                      value={item.deptLevel3}
                      onChange={(e) => updateItem(item.id, 'deptLevel3', e.target.value)}
                    >
                      <option value="">请选择</option>
                      {departments
                        .find(d => d.name === item.deptLevel1)?.children
                        ?.find(d => d.name === item.deptLevel2)?.children?.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-mini"
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                    >
                      <option value="">请选择</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input-mini"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input-mini"
                      value={item.specification}
                      onChange={(e) => updateItem(item.id, 'specification', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input-mini"
                      value={item.functionDesc}
                      onChange={(e) => updateItem(item.id, 'functionDesc', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-mini"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-mini"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    />
                  </td>
                  {item.monthlyQuantity.map((qty, i) => (
                    <td key={i}>
                      <input
                        type="number"
                        className="input-mini"
                        value={qty}
                        onChange={(e) => {
                          const newQty = [...item.monthlyQuantity]
                          newQty[i] = Number(e.target.value)
                          updateItem(item.id, 'monthlyQuantity', newQty)
                        }}
                      />
                    </td>
                  ))}
                  <td>¥{(item.unitPrice * item.quantity).toLocaleString()}</td>
                  <td>
                    <button className="btn-icon-sm" onClick={() => removeItem(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={10} className="text-right font-bold">
                  合计：
                </td>
                <td colSpan={12}></td>
                <td className="font-bold text-primary">¥{totalAmount.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Additional Info */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">补充信息</h3>
        </div>
        <div className="form-grid">
          <div className="input-group full-width">
            <label className="input-label">项目信息</label>
            <input 
              type="text" 
              className="input" 
              placeholder="请输入所属项目"
              value={items[0]?.project || ''}
              onChange={(e) => {
                const newItems = [...items]
                newItems[0] = { ...newItems[0], project: e.target.value }
                setItems(newItems)
              }}
            />
          </div>
          <div className="input-group full-width">
            <label className="input-label">备注说明</label>
            <textarea 
              className="input" 
              rows={3} 
              placeholder="请输入备注信息"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions mt-4">
        <Link to="/budgets" className="btn btn-secondary">
          取消
        </Link>
        <button type="button" className="btn btn-primary" onClick={handleSaveDraft} disabled={submitting}>
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} 保存为草稿
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmitApproval} disabled={submitting}>
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} 提交审批
        </button>
      </div>
    </div>
  )
}
