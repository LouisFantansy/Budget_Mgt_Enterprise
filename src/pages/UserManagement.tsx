import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, Plus, Search, Edit, Key, UserX, UserCheck, X } from 'lucide-react'
import { systemApi } from '../api/modules/system.api'
import type { User, UserStatus, Department } from '../types'
import type { CreateUserRequest, UpdateUserRequest } from '../api/modules/system.api'

interface UserFormData {
  username: string
  password: string
  name: string
  email: string
  phone: string
  departmentId: string
  roleIds: string[]
}

export function UserManagement() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })
  
  // Filter state
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    roleIds: [],
  })
  
  // Available options
  const [departments, setDepartments] = useState<Department[]>([])
  const [availableRoles, setAvailableRoles] = useState<{ id: string; displayName: string }[]>([])

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await systemApi.getUsers({
        page,
        pageSize: pagination.pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      })
      
      setUsers(response.data.items)
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: response.data.totalPages,
      })
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setError(err.response?.data?.message || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      // Fetch departments and roles
      const [rolesRes] = await Promise.all([
        systemApi.getRoles(),
        // Could add department API call here if available
      ])
      
      setAvailableRoles(rolesRes.data.map(r => ({ id: r.id, displayName: r.displayName })))
    } catch (err: any) {
      console.error('Failed to fetch options:', err)
    }
  }

  useEffect(() => {
    fetchUsers(1)
    fetchOptions()
  }, [])

  const handleSearch = () => {
    fetchUsers(1)
  }

  const handleOpenCreate = () => {
    setModalMode('create')
    setSelectedUser(null)
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      departmentId: '',
      roleIds: [],
    })
    setShowModal(true)
  }

  const handleOpenEdit = (user: User) => {
    setModalMode('edit')
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      departmentId: user.departmentId,
      roleIds: user.roles?.map(r => r.roleId) || [],
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (modalMode === 'create') {
        if (!formData.username || !formData.password || !formData.name || !formData.departmentId) {
          setError('请填写必填项')
          return
        }
        
        await systemApi.createUser(formData as CreateUserRequest)
      } else if (selectedUser) {
        const updateData: UpdateUserRequest = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          departmentId: formData.departmentId,
          roleIds: formData.roleIds,
        }
        
        await systemApi.updateUser(selectedUser.id, updateData)
      }
      
      setShowModal(false)
      fetchUsers(pagination.page)
    } catch (err: any) {
      console.error('Save failed:', err)
      setError(err.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
      await systemApi.updateUser(user.id, { status: newStatus as UserStatus })
      fetchUsers(pagination.page)
    } catch (err: any) {
      console.error('Toggle status failed:', err)
      setError(err.response?.data?.message || '操作失败')
    }
  }

  const handleResetPassword = async (user: User) => {
    const newPassword = prompt(`请输入 ${user.name} 的新密码：`)
    if (!newPassword) return
    
    try {
      await systemApi.resetPassword(user.id, { newPassword })
      alert('密码重置成功')
    } catch (err: any) {
      console.error('Reset password failed:', err)
      setError(err.response?.data?.message || '密码重置失败')
    }
  }

  const getStatusTag = (status: UserStatus) => {
    const statusConfig: Record<UserStatus, { label: string; className: string }> = {
      ACTIVE: { label: '启用', className: 'tag-success' },
      DISABLED: { label: '禁用', className: 'tag-danger' },
      LOCKED: { label: '锁定', className: 'tag-warning' },
    }
    return statusConfig[status] || { label: status, className: 'tag-default' }
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">用户管理</h1>
          <p className="page-subtitle">管理系统用户账户</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> 新建用户
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="filters-row">
          <div className="input-group">
            <input
              type="text"
              className="input"
              placeholder="搜索用户名或姓名"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
          >
            <option value="">全部状态</option>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
            <option value="LOCKED">锁定</option>
          </select>
          <button className="btn btn-primary" onClick={handleSearch}>
            <Search size={16} /> 搜索
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card mt-4">
        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={32} />
            <p>加载中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">暂无用户数据</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>姓名</th>
                <th>部门</th>
                <th>角色</th>
                <th>状态</th>
                <th>最后登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const status = getStatusTag(user.status)
                return (
                  <tr key={user.id}>
                    <td className="font-medium">{user.username}</td>
                    <td>{user.name}</td>
                    <td>{user.department?.name || '-'}</td>
                    <td>
                      {user.roles?.map((ur, index) => (
                        <span key={index} className="tag tag-info">{ur.role?.displayName || ur.roleId}</span>
                      ))}
                    </td>
                    <td>
                      <span className={`tag ${status.className}`}>{status.label}</span>
                    </td>
                    <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(user)}
                          title="编辑"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleResetPassword(user)}
                          title="重置密码"
                        >
                          <Key size={14} />
                        </button>
                        <button 
                          className={`btn btn-sm ${user.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'ACTIVE' ? '禁用' : '启用'}
                        >
                          {user.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              上一页
            </button>
            <span className="page-info">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <button 
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? '新建用户' : '编辑用户'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">用户名 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={modalMode === 'edit'}
                    placeholder="请输入用户名"
                  />
                </div>
                {modalMode === 'create' && (
                  <div className="input-group">
                    <label className="input-label">密码 *</label>
                    <input
                      type="password"
                      className="input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="请输入密码"
                    />
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">姓名 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">邮箱</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">手机</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入手机号"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">部门 *</label>
                  <select
                    className="select"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">请选择部门</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group full-width">
                  <label className="input-label">角色</label>
                  <div className="checkbox-group">
                    {availableRoles.map((role) => (
                      <label key={role.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.roleIds.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] })
                            } else {
                              setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.id) })
                            }
                          }}
                        />
                        {role.displayName}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
