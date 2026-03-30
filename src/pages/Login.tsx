import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, User } from '../store/authStore'
import { Shield } from 'lucide-react'
import api from '../utils/api'

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
  
    try {
      const response = await api.post('/auth/login', { username, password })
        
      if (response.code === 200 && response.data) {
        // 保存 token
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('refreshToken', response.data.refreshToken)
          
        // 构建用户对象
        const user: User = {
          id: response.data.user.id,
          username: response.data.user.username,
          name: response.data.user.name,
          role: response.data.user.roles?.[0] || 'user',
          department: response.data.user.department || ''
        }
          
        login(user)
        navigate('/')
      } else {
        setError(response.message || '登录失败')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
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
          <p>默认管理员账号：</p>
          <div className="demo-users">
            <span className="tag tag-primary">用户名：admin</span>
            <span className="tag tag-success">密码：admin123</span>
          </div>
        </div>
      </div>
    </div>
  )
}