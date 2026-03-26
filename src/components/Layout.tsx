import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard,
  FileText,
  Upload,
  Link2,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react'
import { useState } from 'react'

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '仪表盘' },
    { to: '/departments', icon: Building2, label: '部门管理' },
    { to: '/budgets', icon: FileText, label: '预算管理' },
    { to: '/budget/summary', icon: Building2, label: '预算汇总' },
    { to: '/purchase', icon: Upload, label: '采购申请' },
    { to: '/budget-usage', icon: BarChart3, label: '预算占用' },
    { to: '/import/purchase', icon: Upload, label: '采购导入' },
    { to: '/import/settlement', icon: Upload, label: '财务导入' },
    { to: '/mapping', icon: Link2, label: '数据映射' },
    { to: '/approval', icon: CheckSquare, label: '审批中心' },
    { to: '/analysis', icon: BarChart3, label: '差异分析' },
    { to: '/settings', icon: Settings, label: '系统设置' },
  ]

  return (
    <div className="layout">
      {/* Mobile Sidebar */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">预算管理系统</h1>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              end={item.to === '/'}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || '用户'}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="header-title">半导体研发企业预算管理系统</div>
          <div className="header-user">
            <span>{user?.name}</span>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}