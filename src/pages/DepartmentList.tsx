import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight, ChevronDown, Building2, Users, Edit, Trash2 } from 'lucide-react'
import { departmentApi } from '../api/modules/department.api'

// Mock department data
interface Department {
  id: string
  name: string
  level: number
  parentId: string | null
  manager: string
  budgetAdmin: string
  children?: Department[]
}

const mockDepartments: Department[] = [
  {
    id: '1',
    name: '研发事业部',
    level: 1,
    parentId: null,
    manager: '赵总',
    budgetAdmin: '张预算',
    children: [
      {
        id: '1-1',
        name: '研发部',
        level: 2,
        parentId: '1',
        manager: '李研发',
        budgetAdmin: '李研发',
        children: [
          { id: '1-1-1', name: '芯片研发组', level: 3, parentId: '1-1', manager: '王芯片', budgetAdmin: '王芯片' },
          { id: '1-1-2', name: '软件研发组', level: 3, parentId: '1-1', manager: '刘软件', budgetAdmin: '刘软件' },
        ],
      },
      {
        id: '1-2',
        name: '测试部',
        level: 2,
        parentId: '1',
        manager: '张测试',
        budgetAdmin: '张测试',
        children: [
          { id: '1-2-1', name: '功能测试组', level: 3, parentId: '1-2', manager: '陈测试', budgetAdmin: '陈测试' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '生产事业部',
    level: 1,
    parentId: null,
    manager: '钱总',
    budgetAdmin: '周财务',
    children: [
      {
        id: '2-1',
        name: '生产部',
        level: 2,
        parentId: '2',
        manager: '孙生产',
        budgetAdmin: '孙生产',
      },
    ],
  },
  {
    id: '3',
    name: '职能部门',
    level: 1,
    parentId: null,
    manager: '刘总',
    budgetAdmin: '吴财务',
    children: [
      { id: '3-1', name: '财务部', level: 2, parentId: '3', manager: '吴财务', budgetAdmin: '吴财务' },
      { id: '3-2', name: '采购部', level: 2, parentId: '3', manager: '郑采购', budgetAdmin: '郑采购' },
      { id: '3-3', name: 'IT部', level: 2, parentId: '3', manager: '赵IT', budgetAdmin: '赵IT' },
    ],
  },
]

export function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']))
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    parentId: '',
    managerId: '',
    budgetAdminId: '',
  })

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  // Find parent department by ID
  const findParent = (depts: Department[], parentId: string): Department | null => {
    for (const dept of depts) {
      if (dept.id === parentId) return dept
      if (dept.children) {
        const found = findParent(dept.children, parentId)
        if (found) return found
      }
    }
    return null
  }

  // Get available parent departments based on level
  const getAvailableParents = () => {
    if (formData.level === 1) return []
    const result: { id: string; name: string; level: number }[] = []
    const collect = (depts: Department[]) => {
      depts.forEach(dept => {
        if (dept.level < formData.level && dept.level < 3) {
          result.push({ id: dept.id, name: dept.name, level: dept.level })
        }
        if (dept.children) collect(dept.children)
      })
    }
    collect(departments)
    return result
  }

  // Handle add new department
  const handleAdd = () => {
    setEditingDept(null)
    setFormData({
      name: '',
      level: 1,
      parentId: '',
      managerId: '',
      budgetAdminId: '',
    })
    setShowModal(true)
  }

  // Handle edit department
  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      level: dept.level,
      parentId: dept.parentId || '',
      managerId: dept.manager || '',
      budgetAdminId: dept.budgetAdmin || '',
    })
    setShowModal(true)
  }

  // Handle delete department
  const handleDelete = (dept: Department) => {
    if (!confirm(`确定要删除部门 "${dept.name}" 吗？此操作不可恢复！`)) return

    const deleteFromTree = (depts: Department[]): Department[] => {
      return depts
        .filter(d => d.id !== dept.id)
        .map(d => ({
          ...d,
          children: d.children ? deleteFromTree(d.children) : undefined
        }))
    }

    setDepartments(deleteFromTree(departments))
  }

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getTree() as any
      if (response && response.data) {
        const depts = response.data.data || []
        // Ensure departments is an array
        setDepartments(Array.isArray(depts) ? depts : [depts])
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err)
    }
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingDept) {
        // Update existing department
        await departmentApi.update(editingDept.id, {
          name: formData.name,
          managerId: formData.managerId,
          budgetAdminId: formData.budgetAdminId,
        })
      } else {
        // Create new department - auto generate code from name
        const code = formData.name.substring(0, 3).toUpperCase() || 'DEPT'
        await departmentApi.create({
          name: formData.name,
          code: code,
          level: formData.level,
          parentId: formData.level === 1 ? null : formData.parentId || null,
          managerId: formData.managerId,
          budgetAdminId: formData.budgetAdminId,
        })
      }
      
      // Refresh department list
      await fetchDepartments()
      setShowModal(false)
    } catch (err: any) {
      console.error('Failed to save department:', err)
      alert(err.response?.data?.message || '保存部门失败')
    }
  }

  const renderDepartment = (dept: Department, level: number = 0) => {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expandedIds.has(dept.id)
    const paddingLeft = level * 24 + 16

    return (
      <div key={dept.id}>
        <div className="dept-row" style={{ paddingLeft }}>
          <div className="dept-expand">
            {hasChildren ? (
              <button onClick={() => toggleExpand(dept.id)} className="expand-btn">
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : (
              <span className="expand-placeholder" />
            )}
          </div>
          <div className="dept-icon">
            {dept.level === 1 ? <Building2 size={20} /> : <Users size={18} />}
          </div>
          <div className="dept-name">
            <span className="name-text">{dept.name}</span>
            <span className={`dept-level level-${dept.level}`}>
              {dept.level === 1 ? '一级' : dept.level === 2 ? '二级' : '三级'}
            </span>
          </div>
          <div className="dept-manager">{dept.manager}</div>
          <div className="dept-admin">{dept.budgetAdmin}</div>
          <div className="dept-actions">
            <button className="btn-icon" title="编辑" onClick={() => handleEdit(dept)}>
              <Edit size={16} />
            </button>
            <button className="btn-icon" title="删除" onClick={() => handleDelete(dept)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && dept.children!.map((child) => renderDepartment(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="dept-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">部门管理</h1>
          <p className="page-subtitle">管理组织部门层级结构</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={16} /> 新建部门
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="search-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input"
              placeholder="搜索部门名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Department Tree */}
        <div className="dept-table">
          <div className="dept-header">
            <div style={{ width: 40 }}></div>
            <div style={{ width: 40 }}></div>
            <div style={{ flex: 2 }}>部门名称</div>
            <div style={{ width: 120 }}>负责人</div>
            <div style={{ width: 120 }}>预算管理员</div>
            <div style={{ width: 100 }}>操作</div>
          </div>
          <div className="dept-body">
            {departments.map((dept) => renderDepartment(dept))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingDept ? '编辑部门' : '新建部门'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">部门名称 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入部门名称"
                    required
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">部门级别 *</label>
                  <select
                    className="select"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    disabled={!!editingDept}
                  >
                    <option value={1}>一级部门</option>
                    <option value={2}>二级部门</option>
                    <option value={3}>三级部门</option>
                  </select>
                  {editingDept && (
                    <p className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>
                      部门级别创建后不可修改
                    </p>
                  )}
                </div>
                {formData.level > 1 && (
                  <div className="input-group">
                    <label className="input-label">上级部门 *</label>
                    <select
                      className="select"
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      required
                    >
                      <option value="">请选择上级部门</option>
                      {getAvailableParents().map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {'　'.repeat(parent.level - 1)}{parent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">部门负责人 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    placeholder="请输入负责人ID或姓名"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">预算管理员 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.budgetAdminId}
                    onChange={(e) => setFormData({ ...formData, budgetAdminId: e.target.value })}
                    placeholder="请输入预算管理员ID或姓名"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDept ? '保存修改' : '创建部门'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="quick-links mt-4">
        <Link to="/budgets/create" className="quick-link-card">
          <div className="quick-link-icon">
            <Plus size={24} />
          </div>
          <div className="quick-link-text">
            <div className="quick-link-title">编制预算</div>
            <div className="quick-link-desc">开始编制年度预算</div>
          </div>
          <ChevronRight size={20} />
        </Link>
        <Link to="/budget/summary" className="quick-link-card">
          <div className="quick-link-icon">
            <Building2 size={24} />
          </div>
          <div className="quick-link-text">
            <div className="quick-link-title">预算汇总</div>
            <div className="quick-link-desc">查看预算汇总报表</div>
          </div>
          <ChevronRight size={20} />
        </Link>
        <Link to="/purchase/create" className="quick-link-card">
          <div className="quick-link-icon">
            <Users size={24} />
          </div>
          <div className="quick-link-text">
            <div className="quick-link-title">采购申请</div>
            <div className="quick-link-desc">提交采购申请单</div>
          </div>
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  )
}