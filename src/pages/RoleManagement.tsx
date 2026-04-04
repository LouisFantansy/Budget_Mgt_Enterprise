import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, Plus, Edit, Trash2, X, Shield } from 'lucide-react'
import { systemApi } from '../api/modules/system.api'
import type { Role, Permission } from '../types'
import type { CreateRoleRequest } from '../api/modules/system.api'

interface RoleFormData {
  name: string
  displayName: string
  description: string
  permissionIds: string[]
}

export function RoleManagement() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    displayName: '',
    description: '',
    permissionIds: [],
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [rolesRes, permissionsRes] = await Promise.all([
        systemApi.getRoles(),
        systemApi.getPermissions(),
      ]) as any
      
      const rolesData = rolesRes?.data?.data || rolesRes?.data || []
      const permissionsData = permissionsRes?.data?.data || permissionsRes?.data || []
      
      setRoles(Array.isArray(rolesData) ? rolesData : [])
      setPermissions(Array.isArray(permissionsData) ? permissionsData : [])
    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      // 优雅处理：设置为空数组而不是显示错误
      setRoles([])
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setModalMode('create')
    setSelectedRole(null)
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissionIds: [],
    })
    setShowModal(true)
  }

  const handleOpenEdit = (role: Role) => {
    setModalMode('edit')
    setSelectedRole(role)
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissionIds: role.permissions?.map(p => p.permissionId) || [],
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (!formData.name || !formData.displayName) {
        setError('请填写必填项')
        return
      }
      
      if (modalMode === 'create') {
        await systemApi.createRole(formData as CreateRoleRequest)
      } else if (selectedRole) {
        await systemApi.updateRolePermissions(selectedRole.id, {
          permissionIds: formData.permissionIds,
        })
      }
      
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      console.error('Save failed:', err)
      setError(err.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      alert('系统角色不能删除')
      return
    }
    
    if (!confirm(`确定要删除角色 "${role.displayName}" 吗？`)) {
      return
    }
    
    try {
      await systemApi.deleteRole(role.id)
      fetchData()
    } catch (err: any) {
      console.error('Delete failed:', err)
      setError(err.response?.data?.message || '删除失败')
    }
  }

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module || '其他'
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }))
  }

  const toggleModule = (module: string, checked: boolean) => {
    const modulePermissions = groupedPermissions[module].map(p => p.id)
    setFormData(prev => ({
      ...prev,
      permissionIds: checked
        ? [...new Set([...prev.permissionIds, ...modulePermissions])]
        : prev.permissionIds.filter(id => !modulePermissions.includes(id)),
    }))
  }

  const isModuleChecked = (module: string) => {
    const modulePermissions = groupedPermissions[module].map(p => p.id)
    return modulePermissions.every(id => formData.permissionIds.includes(id))
  }

  const isModuleIndeterminate = (module: string) => {
    const modulePermissions = groupedPermissions[module].map(p => p.id)
    const checkedCount = modulePermissions.filter(id => formData.permissionIds.includes(id)).length
    return checkedCount > 0 && checkedCount < modulePermissions.length
  }

  return (
    <div className="role-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">角色管理</h1>
          <p className="page-subtitle">管理系统角色和权限</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> 新建角色
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Roles List */}
      <div className="card">
        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={32} />
            <p>加载中...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="empty-state">暂无角色数据</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>角色名称</th>
                <th>标识符</th>
                <th>描述</th>
                <th>权限数量</th>
                <th>类型</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="font-medium">
                    <Shield size={16} className="inline mr-2" />
                    {role.displayName}
                  </td>
                  <td><code className="code">{role.name}</code></td>
                  <td>{role.description || '-'}</td>
                  <td>{role.permissions?.length || 0} 项</td>
                  <td>
                    <span className={`tag ${role.isSystem ? 'tag-info' : 'tag-default'}`}>
                      {role.isSystem ? '系统角色' : '自定义角色'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(role)}
                        title="编辑权限"
                      >
                        <Edit size={14} />
                      </button>
                      {!role.isSystem && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(role)}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? '新建角色' : '编辑角色权限'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {modalMode === 'create' ? (
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">角色名称 *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="请输入角色名称"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">标识符 *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      placeholder="例如：ROLE_ADMIN"
                    />
                    <p className="input-help">用于系统内部识别，建议使用大写字母和下划线</p>
                  </div>
                  <div className="input-group full-width">
                    <label className="input-label">描述</label>
                    <textarea
                      className="input textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="请输入角色描述"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="role-info mb-4">
                  <h4>{selectedRole?.displayName}</h4>
                  <p className="text-secondary">{selectedRole?.description}</p>
                </div>
              )}

              {/* Permission Matrix */}
              <div className="permission-section">
                <h4 className="section-title">权限配置</h4>
                <div className="permission-matrix">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module} className="permission-group">
                      <div className="permission-group-header">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isModuleChecked(module)}
                            ref={(el) => {
                              if (el) el.indeterminate = isModuleIndeterminate(module)
                            }}
                            onChange={(e) => toggleModule(module, e.target.checked)}
                          />
                          <strong>{module}</strong>
                        </label>
                      </div>
                      <div className="permission-items">
                        {perms.map((permission) => (
                          <label key={permission.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            {permission.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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
