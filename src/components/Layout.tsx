import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { useWebSocket } from '../hooks/useWebSocket'
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
  Bell,
  Users,
  Shield,
  FileSearch,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function Layout() {
  const { user, logout } = useAuthStore()
  const { unreadCount, notifications, markAsRead, setUnreadCount, setNotifications } = useNotificationStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [systemMenuOpen, setSystemMenuOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  // WebSocket connection for real-time notifications
  useWebSocket({
    autoConnect: true,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
  })

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMarkAllAsRead = async () => {
    // Update local state immediately
    setUnreadCount(0)
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
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
  ]

  const systemMenuItems = [
    { to: '/users', icon: Users, label: '用户管理' },
    { to: '/roles', icon: Shield, label: '角色管理' },
    { to: '/audit-logs', icon: FileSearch, label: '审计日志' },
  ]

  const formatNotificationTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

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
          
          {/* System Management Group */}
          <div className="nav-group">
            <button 
              className={`nav-group-header ${systemMenuOpen ? 'active' : ''}`}
              onClick={() => setSystemMenuOpen(!systemMenuOpen)}
            >
              <Settings size={20} />
              <span>系统管理</span>
              {systemMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {systemMenuOpen && (
              <div className="nav-group-items">
                {systemMenuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <NavLink
                  to="/settings"
                  className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings size={18} />
                  <span>系统设置</span>
                </NavLink>
              </div>
            )}
          </div>
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
          
          {/* Notification Bell */}
          <div className="header-actions">
            <div className="notification-wrapper" ref={notificationRef}>
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>通知</h4>
                    {unreadCount > 0 && (
                      <button className="btn-link" onClick={handleMarkAllAsRead}>
                        全部已读
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">暂无通知</div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                          onClick={() => {
                            markAsRead(notification.id)
                            if (notification.link) {
                              navigate(notification.link)
                              setShowNotifications(false)
                            }
                          }}
                        >
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-content">{notification.content}</div>
                          <div className="notification-time">
                            {formatNotificationTime(notification.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <button 
                        className="btn-link"
                        onClick={() => {
                          setShowNotifications(false)
                          // Navigate to notifications page if exists
                        }}
                      >
                        查看全部
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="header-user">
              <span>{user?.name}</span>
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
