import { useState, useEffect } from 'react'
import { User, Settings as SettingsIcon, Bell, Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { systemApi } from '../api/modules/system.api'
import type { SystemConfig } from '../api/modules/system.api'

interface SettingsForm {
  companyName: string
  fiscalYearStart: string
  currency: string
  alertThreshold: number
  autoApprove: boolean
  twoFactorAuth: boolean
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsForm>({
    companyName: '',
    fiscalYearStart: '01',
    currency: 'CNY',
    alertThreshold: 80,
    autoApprove: false,
    twoFactorAuth: false,
  })

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await systemApi.getConfig() as any
        const configs = response?.data?.data || response?.data || []
        
        // Transform config array to settings object
        const configMap: Record<string, string> = {}
        if (Array.isArray(configs)) {
          configs.forEach((config: SystemConfig) => {
            configMap[config.key] = config.value
          })
        }
        
        setSettings({
          companyName: configMap['companyName'] || '',
          fiscalYearStart: configMap['fiscalYearStart'] || '01',
          currency: configMap['currency'] || 'CNY',
          alertThreshold: Number(configMap['alertThreshold']) || 80,
          autoApprove: configMap['autoApprove'] === 'true',
          twoFactorAuth: configMap['twoFactorAuth'] === 'true',
        })
      } catch (err: any) {
        console.error('Failed to fetch config:', err)
        // 优雅处理：API 不存在时保持默认配置
        setLoading(false)
        return
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      await systemApi.updateConfig({
        configs: [
          { key: 'companyName', value: settings.companyName },
          { key: 'fiscalYearStart', value: settings.fiscalYearStart },
          { key: 'currency', value: settings.currency },
          { key: 'alertThreshold', value: String(settings.alertThreshold) },
          { key: 'autoApprove', value: String(settings.autoApprove) },
          { key: 'twoFactorAuth', value: String(settings.twoFactorAuth) },
        ],
      })
      
      setSuccess('设置已保存')
    } catch (err: any) {
      console.error('Failed to save config:', err)
      setError(err.response?.data?.message || '保存配置失败')
    } finally {
      setSaving(false)
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">系统设置</h1>
          <p className="page-subtitle">配置系统参数和用户管理</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" onClick={clearMessages}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" onClick={clearMessages}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      <div className="settings-layout">
        <div className="settings-nav">
          <button className={`nav-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <SettingsIcon size={18} /> 通用设置
          </button>
          <button className={`nav-item ${activeTab === 'alert' ? 'active' : ''}`} onClick={() => setActiveTab('alert')}>
            <Bell size={18} /> 预警设置
          </button>
          <button className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <Shield size={18} /> 安全设置
          </button>
          <button className={`nav-item ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>
            <User size={18} /> 用户管理
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
                  <input 
                    type="text" 
                    className="input" 
                    value={settings.companyName} 
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">财年起始月份</label>
                  <select 
                    className="select" 
                    value={settings.fiscalYearStart} 
                    onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                  >
                    <option value="01">1月</option>
                    <option value="04">4月</option>
                    <option value="07">7月</option>
                    <option value="10">10月</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">货币单位</label>
                  <select 
                    className="select" 
                    value={settings.currency} 
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  >
                    <option value="CNY">人民币 (CNY)</option>
                    <option value="USD">美元 (USD)</option>
                    <option value="EUR">欧元 (EUR)</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存设置'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'alert' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">预警设置</h3>
              </div>
              <div className="input-group">
                <label className="input-label">预算消耗预警阈值 (%)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={settings.alertThreshold} 
                  onChange={(e) => setSettings({ ...settings, alertThreshold: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
                <p className="input-help">当预算执行率超过此值时发送预警通知</p>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存设置'}
                </button>
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
                  <input 
                    type="checkbox" 
                    checked={settings.twoFactorAuth} 
                    onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })} 
                  />
                  启用双因素认证
                </label>
                <p className="input-help">启用后，用户登录时需要输入验证码</p>
              </div>
              <div className="input-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.autoApprove} 
                    onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })} 
                  />
                  启用自动审批
                </label>
                <p className="input-help">启用后，符合条件的项目将自动审批通过</p>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存设置'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">用户管理</h3>
                <p className="text-secondary text-sm">
                  请通过左侧菜单"用户管理"进行用户相关操作
                </p>
              </div>
              <div className="info-message">
                <p>用户管理功能已移至独立的用户管理页面，提供更完整的用户管理功能：</p>
                <ul>
                  <li>用户列表查看与搜索</li>
                  <li>新建/编辑用户</li>
                  <li>启用/禁用用户</li>
                  <li>重置密码</li>
                  <li>分配角色</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
