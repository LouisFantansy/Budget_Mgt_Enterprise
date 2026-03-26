import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Send, Copy } from 'lucide-react'

interface BudgetItemDetail {
  id: string
  deptLevel1: string
  deptLevel2: string
  deptLevel3: string
  category: string
  name: string
  specification: string
  function: string
  unitPrice: number
  quantity: number
  monthlyQuantity: number[]
  monthlyAmount: number[]
  project: string
  purpose: string
  supplier: string
  deliveryDate: string
}

const mockBudgetItems: BudgetItemDetail[] = [
  {
    id: '1',
    deptLevel1: '研发事业部',
    deptLevel2: '研发部',
    deptLevel3: '芯片研发组',
    category: '材料费',
    name: '测试晶圆',
    specification: '8 inch',
    function: '芯片工艺验证',
    unitPrice: 5000,
    quantity: 100,
    monthlyQuantity: [10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 0],
    monthlyAmount: Array(12).fill(50000),
    project: '项目A',
    purpose: '新产品开发',
    supplier: '供应商A',
    deliveryDate: '2024-12-31',
  },
]

export function BudgetCreateAdvanced() {
  const [items, setItems] = useState<BudgetItemDetail[]>(mockBudgetItems)
  const [budgetType, setBudgetType] = useState('Opex')

  const addItem = () => {
    const newItem: BudgetItemDetail = {
      id: Date.now().toString(),
      deptLevel1: '',
      deptLevel2: '',
      deptLevel3: '',
      category: '',
      name: '',
      specification: '',
      function: '',
      unitPrice: 0,
      quantity: 0,
      monthlyQuantity: Array(12).fill(0),
      monthlyAmount: Array(12).fill(0),
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

  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

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
          <button className="btn btn-primary">
            <Save size={16} /> 保存草稿
          </button>
          <button className="btn btn-primary">
            <Send size={16} /> 提交审批
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
            <select className="select" value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
              <option value="Opex">Opex - 运营性支出</option>
              <option value="Capex">Capex - 资本性支出</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">年度 *</label>
            <select className="select">
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">编制部门</label>
            <input type="text" className="input" value="研发事业部" readOnly />
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
          <h3 className="card-title">预算明细（{budgetType}）</h3>
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
                      <option value="研发事业部">研发事业部</option>
                      <option value="生产事业部">生产事业部</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-mini"
                      value={item.deptLevel2}
                      onChange={(e) => updateItem(item.id, 'deptLevel2', e.target.value)}
                    >
                      <option value="">请选择</option>
                      <option value="研发部">研发部</option>
                      <option value="测试部">测试部</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-mini"
                      value={item.deptLevel3}
                      onChange={(e) => updateItem(item.id, 'deptLevel3', e.target.value)}
                    >
                      <option value="">请选择</option>
                      <option value="芯片研发组">芯片研发组</option>
                      <option value="软件研发组">软件研发组</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-mini"
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                    >
                      <option value="">请选择</option>
                      <option value="材料费">材料费</option>
                      <option value="测试费">测试费</option>
                      <option value="设备费">设备费</option>
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
                      value={item.function}
                      onChange={(e) => updateItem(item.id, 'function', e.target.value)}
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
            <input type="text" className="input" placeholder="请输入所属项目" />
          </div>
          <div className="input-group full-width">
            <label className="input-label">用途说明</label>
            <textarea className="input" rows={3} placeholder="请详细说明采购用途" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions mt-4">
        <Link to="/budgets" className="btn btn-secondary">
          取消
        </Link>
        <button type="button" className="btn btn-primary">
          <Save size={16} /> 保存为草稿
        </button>
        <button type="submit" className="btn btn-primary">
          <Send size={16} /> 提交审批
        </button>
      </div>
    </div>
  )
}