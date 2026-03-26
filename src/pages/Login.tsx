import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, User } from '../store/authStore'
import { Shield } from 'lucide-react'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Demo login - in production, this would be an API call
    setTimeout(() => {
      const mockUsers: Record<string, User> = {
        'admin': { id: '1', username: 'admin', name: '系统管理员', role: 'admin', department: 'IT部' },
        'budget': { id: '2', username: 'budget', name: '张预算', role: 'budget_manager', department: '财务部' },
        'dept': { id: '3', username: 'dept', name: '李部门', role: 'department_head', department: '研发部' },
        'finance': { id: '4', username: 'finance', name: '王财务', role: 'finance', department: '财务部' },
        'gm': { id: '5', username: 'gm', name: '赵总', role: 'general_manager', department: '总经理办公室' },
      }

      const user = mockUsers[username]
      if (user && password === '123456') {
        login(user)
        navigate('/')
      } else {
        setError('用户名或密码错误')
      }
      setLoading(false)
    }, 500)
  }

  const roleLabels: Record<string, string> = {
    admin: '系统管理员',
    budget_manager: '预算管理员',
    department_head: '部门负责人',
    finance: '财务',
    general_manager: '总经理',
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <Shield size={48} />
          </div>
          <h1>预算管理系统</h1>
          <p>半导体研发企业预算管理平台</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">用户名</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">密码</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-demo">
          <p>演示账号（密码均为 123456）：</p>
          <div className="demo-users">
            {Object.entries(roleLabels).map(([role, label]) => (
              <span key={role} className="tag tag-primary">{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}