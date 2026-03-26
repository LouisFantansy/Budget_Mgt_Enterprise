import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight, Edit, Trash2 } from 'lucide-react'

// Mock data
const mockBudgets = [
  { id: '1', name: '2024 年度研发部预算', department: '研发部', type: 'Opex', budget: 15000000, used: 12000000, status: 'approved', year: 2024 },
  { id: '2', name: '2024 年度生产部预算', department: '生产部', type: 'Capex', budget: 12000000, used: 9000000, status: 'approved', year: 2024 },
  { id: '3', name: '2024 年度采购部预算', department: '采购部', type: 'Opex', budget: 8000000, used: 6000000, status: 'pending', year: 2024 },
  { id: '4', name: '2024 年度质量部预算', department: '质量部', type: 'Opex', budget: 6000000, used: 3000000, status: 'approved', year: 2024 },
  { id: '5', name: '2024 年度 IT 部预算', department: 'IT 部', type: 'Capex', budget: 5000000, used: 2500000, status: 'draft', year: 2024 },
  { id: '6', name: '2024 年度行政部预算', department: '行政部', type: 'Opex', budget: 4000000, used: 1500000, status: 'approved', year: 2024 },
]

const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  rejected: '已拒绝',
  adjusted: '已调整',
}

const typeLabels: Record<string, string> = {
  Capex: '资本性支出',
  Opex: '运营性支出',
}

export function BudgetList() {
  const [budgets, setBudgets] = useState(mockBudgets)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    type: 'Opex',
    budget: 0,
    year: new Date().getFullYear(),
  })

  const formatCurrency = (value: number) => {
    return `¥${(value / 10000).toFixed(0)}万`
  }

  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase()) || budget.department.includes(searchTerm)
    const matchesType = !typeFilter || budget.type === typeFilter
    const matchesStatus = !statusFilter || budget.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleAdd = () => {
    setEditingBudget(null)
    setFormData({
      name: '',
      department: '',
      type: 'Opex',
      budget: 0,
      year: new Date().getFullYear(),
    })
    setShowModal(true)
  }

  const handleEdit = (budget: any) => {
    setEditingBudget(budget)
    setFormData({
      name: budget.name,
      department: budget.department,
      type: budget.type,
      budget: budget.budget,
      year: budget.year,
    })
    setShowModal(true)
  }

  const handleDelete = (budget: any) => {
    if (!confirm(`确定要删除预算 "${budget.name}" 吗？此操作不可恢复！`)) return
    setBudgets(budgets.filter(b => b.id !== budget.id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingBudget) {
      // Update existing
      setBudgets(budgets.map(b => 
        b.id === editingBudget.id 
          ? { ...b, ...formData }
          : b
      ))
    } else {
      // Create new
      const newBudget = {
        id: `${Date.now()}`,
        ...formData,
        used: 0,
        status: 'draft' as const,
      }
      setBudgets([...budgets, newBudget])
    }
    
    setShowModal(false)
  }

  return (
    <div className="budget-list">
      <div className="page-header">
        <div>
          <h1 className="page-title">预算管理</h1>
          <p className="page-subtitle">管理年度预算编制和执行</p>
        </div>
        <Link to="/budgets/create" className="btn btn-primary" onClick={(e) => { e.preventDefault(); handleAdd(); }}>
          <Plus size={16} />
          新建预算
        </Link>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingBudget ? '编辑预算' : '新建预算'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">预算名称 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例：2024 年度研发部预算"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">部门 *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="请输入部门名称"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">类型 *</label>
                    <select
                      className="select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="Opex">Opex (运营性支出)</option>
                      <option value="Capex">Capex (资本性支出)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">预算金额（元） *</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">年度 *</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      min="2020"
                      max="2030"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? '保存修改' : '创建预算'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input"
              placeholder="搜索预算名称或部门..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">全部类型</option>
            <option value="Capex">Capex</option>
            <option value="Opex">Opex</option>
          </select>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">待审批</option>
            <option value="approved">已审批</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* Budget Table */}
      <div className="card mt-4">
        <table className="table">
          <thead>
            <tr>
              <th>预算名称</th>
              <th>部门</th>
              <th>类型</th>
              <th>预算金额</th>
              <th>已使用</th>
              <th>执行率</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredBudgets.map((budget) => {
              const rate = ((budget.used / budget.budget) * 100).toFixed(1)
              return (
                <tr key={budget.id}>
                  <td className="font-medium">{budget.name}</td>
                  <td>{budget.department}</td>
                  <td>
                    <span className={`tag ${budget.type === 'Capex' ? 'tag-primary' : 'tag-success'}`}>
                      {typeLabels[budget.type]}
                    </span>
                  </td>
                  <td>{formatCurrency(budget.budget)}</td>
                  <td>{formatCurrency(budget.used)}</td>
                  <td>
                    <div className="progress" style={{ width: '80px' }}>
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
                        budget.status === 'approved'
                          ? 'tag-success'
                          : budget.status === 'pending'
                          ? 'tag-warning'
                          : budget.status === 'rejected'
                          ? 'tag-danger'
                          : 'tag-primary'
                      }`}
                    >
                      {statusLabels[budget.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link to={`/budgets/${budget.id}`} className="btn-link">
                        查看 <ChevronRight size={14} />
                      </Link>
                      <button 
                        className="btn-icon" 
                        title="编辑"
                        onClick={() => handleEdit(budget)}
                        style={{ padding: '4px' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="删除"
                        onClick={() => handleDelete(budget)}
                        style={{ padding: '4px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredBudgets.length === 0 && (
          <div className="empty-state">
            <p>没有找到符合条件的预算</p>
          </div>
        )}
      </div>
    </div>
  )
}