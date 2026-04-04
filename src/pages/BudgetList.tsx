import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, Edit, Trash2, Loader2 } from 'lucide-react'
import { budgetApi } from '../api/modules/budget.api'
import { departmentApi, DepartmentTreeNode } from '../api/modules/department.api'
import type { Budget, BudgetType, BudgetStatus } from '../types'

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '待审批',
  APPROVED: '已审批',
  REJECTED: '已拒绝',
  ADJUSTED: '已调整',
  CLOSED: '已关闭',
}

const typeLabels: Record<string, string> = {
  CAPEX: '资本性支出',
  OPEX: '运营性支出',
}

export function BudgetList() {
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    type: 'OPEX' as BudgetType,
    totalAmount: 0,
    year: new Date().getFullYear(),
  })
  const [submitting, setSubmitting] = useState(false)

  // 加载部门列表
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentApi.getTree() as any
        const deptData = response.data?.data || response.data
        if (deptData) {
          setDepartments(deptData)
        }
      } catch (err) {
        console.error('加载部门失败:', err)
      }
    }
    fetchDepartments()
  }, [])

  // 加载预算列表
  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      }
      if (searchTerm) params.keyword = searchTerm
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      if (departmentFilter) params.departmentId = departmentFilter
      if (yearFilter) params.year = Number(yearFilter)

      const response = await budgetApi.getList(params) as any
      console.log('BudgetList API response:', response)
      const responseData = response.data?.data || response.data || {}
      if (responseData) {
        setBudgets(responseData.items || [])
        setPagination(prev => ({
          ...prev,
          total: responseData.total || 0,
          totalPages: responseData.totalPages || 0,
        }))
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '加载预算列表失败')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, searchTerm, typeFilter, statusFilter, departmentFilter, yearFilter])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const formatCurrency = (value: number) => {
    return `¥${(value / 10000).toFixed(0)}万`
  }

  const handleAdd = () => {
    navigate('/budgets/create')
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      name: budget.name,
      departmentId: budget.departmentId,
      type: budget.type,
      totalAmount: budget.totalAmount,
      year: budget.year,
    })
    setShowModal(true)
  }

  const handleDelete = async (budget: Budget) => {
    if (!confirm(`确定要删除预算 "${budget.name}" 吗？此操作不可恢复！`)) return
    try {
      await budgetApi.remove(budget.id)
      alert('删除成功')
      fetchBudgets()
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingBudget) {
        await budgetApi.update(editingBudget.id, {
          name: formData.name,
        })
        alert('更新成功')
      }
      setShowModal(false)
      fetchBudgets()
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 获取部门名称
  const getDepartmentName = (deptId: string, depts: DepartmentTreeNode[]): string => {
    for (const dept of depts) {
      if (dept.id === deptId) return dept.name
      if (dept.children) {
        const found = getDepartmentName(deptId, dept.children)
        if (found) return found
      }
    }
    return '-'
  }

  // 扁平化部门列表用于下拉选择
  const flattenDepartments = (depts: DepartmentTreeNode[], level: number = 0): { id: string; name: string; level: number }[] => {
    return depts.flatMap(dept => [
      { id: dept.id, name: dept.name, level },
      ...(dept.children ? flattenDepartments(dept.children, level + 1) : [])
    ])
  }

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

  return (
    <div className="budget-list">
      <div className="page-header">
        <div>
          <h1 className="page-title">预算管理</h1>
          <p className="page-subtitle">管理年度预算编制和执行</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus size={16} />
          新建预算
        </button>
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
                    <select
                      className="select"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      required
                      disabled={!!editingBudget}
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
                    <label className="input-label">类型 *</label>
                    <select
                      className="select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as BudgetType })}
                      required
                      disabled={!!editingBudget}
                    >
                      <option value="OPEX">OPEX (运营性支出)</option>
                      <option value="CAPEX">CAPEX (资本性支出)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">预算金额（元）</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      disabled
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">年度 *</label>
                    <select
                      className="select"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      disabled={!!editingBudget}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '处理中...' : (editingBudget ? '保存修改' : '创建预算')}
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
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            />
          </div>
          <select 
            className="select" 
            value={departmentFilter} 
            onChange={(e) => {
              setDepartmentFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            style={{ width: '150px' }}
          >
            <option value="">全部部门</option>
            {flattenDepartments(departments).map((dept) => (
              <option key={dept.id} value={dept.id}>
                {'　'.repeat(dept.level)}{dept.name}
              </option>
            ))}
          </select>
          <select 
            className="select" 
            value={typeFilter} 
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            style={{ width: '150px' }}
          >
            <option value="">全部类型</option>
            <option value="CAPEX">CAPEX</option>
            <option value="OPEX">OPEX</option>
          </select>
          <select 
            className="select" 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            style={{ width: '150px' }}
          >
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="PENDING">待审批</option>
            <option value="APPROVED">已审批</option>
            <option value="REJECTED">已拒绝</option>
          </select>
          <select 
            className="select" 
            value={yearFilter} 
            onChange={(e) => {
              setYearFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            style={{ width: '120px' }}
          >
            <option value="">全部年度</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card mt-4" style={{ padding: '16px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Budget Table */}
      <div className="card mt-4">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>加载中...</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>预算编号</th>
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
              {budgets.map((budget) => {
                const rate = budget.totalAmount > 0 
                  ? ((budget.usedAmount / budget.totalAmount) * 100).toFixed(1) 
                  : '0.0'
                return (
                  <tr key={budget.id}>
                    <td className="font-medium">{budget.budgetNo}</td>
                    <td className="font-medium">{budget.name}</td>
                    <td>{budget.department?.name || getDepartmentName(budget.departmentId, departments)}</td>
                    <td>
                      <span className={`tag ${budget.type === 'CAPEX' ? 'tag-primary' : 'tag-success'}`}>
                        {typeLabels[budget.type]}
                      </span>
                    </td>
                    <td>{formatCurrency(budget.totalAmount)}</td>
                    <td>{formatCurrency(budget.usedAmount)}</td>
                    <td>
                      <div className="progress" style={{ width: '80px' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${Math.min(Number(rate), 100)}%`,
                            background: Number(rate) > 100 ? '#ff3b30' : Number(rate) > 80 ? '#ff9500' : '#34c759',
                          }}
                        />
                      </div>
                      <span className="text-sm ml-2">{rate}%</span>
                    </td>
                    <td>
                      <span
                        className={`tag ${
                          budget.status === 'APPROVED'
                            ? 'tag-success'
                            : budget.status === 'PENDING'
                            ? 'tag-warning'
                            : budget.status === 'REJECTED'
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
        )}

        {!loading && budgets.length === 0 && (
          <div className="empty-state">
            <p>没有找到符合条件的预算</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                上一页
              </button>
              <button
                className="btn btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
