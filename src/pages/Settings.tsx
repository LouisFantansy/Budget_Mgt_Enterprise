import { useState } from 'react'
import { User, Settings as SettingsIcon, Bell, Shield } from 'lucide-react'

// Mock settings
const mockSettings = {
  companyName: '某某半导体研发企业',
  fiscalYearStart: '01',
  currency: 'CNY',
  alertThreshold: 80,
  autoApprove: false,
}

export function Settings() {
  const [settings, setSettings] = useState(mockSettings)
  const [activeTab, setActiveTab] = useState('general')

  const handleSave = () => {
    console.log('Saving settings:', settings)
    alert('设置已保存')
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">系统设置</h1>
          <p className="page-subtitle">配置系统参数和用户管理</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-nav">
          <button className={`nav-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <SettingsIcon size={18} /> 通用设置
          </button>
          <button className={`nav-item ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>
            <User size={18} /> 用户管理
          </button>
          <button className={`nav-item ${activeTab === 'alert' ? 'active' : ''}`} onClick={() => setActiveTab('alert')}>
            <Bell size={18} /> 预警设置
          </button>
          <button className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <Shield size={18} /> 安全设置
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">通用设置</h3>
              </div>
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">公司名称</label>
                  <input type="text" className="input" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">财年起始月份</label>
                  <select className="select" value={settings.fiscalYearStart} onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}>
                    <option value="01">1月</option>
                    <option value="04">4月</option>
                    <option value="07">7月</option>
                    <option value="10">10月</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">货币单位</label>
                  <select className="select" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                    <option value="CNY">人民币 (CNY)</option>
                    <option value="USD">美元 (USD)</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave}>保存设置</button>
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">用户管理</h3>
                <button className="btn btn-primary">添加用户</button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>用户名</th>
                    <th>姓名</th>
                    <th>部门</th>
                    <th>角色</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>admin</td>
                    <td>系统管理员</td>
                    <td>IT部</td>
                    <td>管理员</td>
                    <td><span className="tag tag-success">启用</span></td>
                  </tr>
                  <tr>
                    <td>budget</td>
                    <td>张预算</td>
                    <td>财务部</td>
                    <td>预算管理员</td>
                    <td><span className="tag tag-success">启用</span></td>
                  </tr>
                  <tr>
                    <td>dept</td>
                    <td>李部门</td>
                    <td>研发部</td>
                    <td>部门负责人</td>
                    <td><span className="tag tag-success">启用</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'alert' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">预警设置</h3>
              </div>
              <div className="input-group">
                <label className="input-label">预算消耗预警阈值 (%)</label>
                <input type="number" className="input" value={settings.alertThreshold} onChange={(e) => setSettings({ ...settings, alertThreshold: Number(e.target.value) })} />
                <p className="input-help">当预算执行率超过此值时发送预警通知</p>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave}>保存设置</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">安全设置</h3>
              </div>
              <div className="input-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.autoApprove} onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })} />
                  启用双因素认证
                </label>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave}>保存设置</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}