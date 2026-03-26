import { useState } from 'react'
import { TrendingUp, Lock, RefreshCw } from 'lucide-react'

interface BudgetUsage {
  id: string
  budgetCode: string
  budgetName: string
  totalBudget: number
  occupied: number
  used: number
  available: number
  usageRate: number
}

const mockUsageData: BudgetUsage[] = [
  {
    id: '1',
    budgetCode: 'BUD-2024-001',
    budgetName: '测试晶圆采购',
    totalBudget: 500000,
    occupied: 50000, // 已申请待审批
    used: 200000, // 已批准使用
    available: 250000,
    usageRate: 50,
  },
  {
    id: '2',
    budgetCode: 'BUD-2024-002',
    budgetName: '测试设备采购',
    totalBudget: 800000,
    occupied: 100000,
    used: 300000,
    available: 400000,
    usageRate: 50,
  },
]

export function BudgetUsageTracker() {
  const [usageData] = useState(mockUsageData)

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(2)}万`

  return (
    <div className="budget-usage-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">预算占用与释放</h1>
          <p className="page-subtitle">实时监控预算占用、使用和可用余额</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">总预算</div>
          <div className="stat-value">{formatCurrency(1300000)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已占用（申请中）</div>
          <div className="stat-value text-warning">{formatCurrency(150000)}</div>
          <div className="stat-desc">
            <Lock size={12} /> 待审批的申请
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已使用（已批准）</div>
          <div className="stat-value text-primary">{formatCurrency(500000)}</div>
          <div className="stat-desc">
            <TrendingUp size={12} /> 实际支出
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">可用余额</div>
          <div className="stat-value text-success">{formatCurrency(650000)}</div>
        </div>
      </div>

      {/* Usage Logic Explanation */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">预算占用与释放机制</h3>
        </div>
        <div className="logic-explanation">
          <div className="logic-step">
            <div className="step-icon">
              <div className="icon-circle">1</div>
            </div>
            <div className="step-content">
              <h4>提交申请时 - 占用预算</h4>
              <p>当需求人提交采购申请时，系统自动锁定对应金额，防止重复申请</p>
              <div className="formula">可用余额 = 总预算 - 已使用 - 已占用</div>
            </div>
          </div>
          <div className="logic-step">
            <div className="step-icon">
              <div className="icon-circle">2</div>
            </div>
            <div className="step-content">
              <h4>审批通过后 - 扣减预算</h4>
              <p>审批流程完成后，占用金额转为实际使用，正式扣减预算额度</p>
              <div className="formula">已使用 += 申请金额，已占用 -= 申请金额</div>
            </div>
          </div>
          <div className="logic-step">
            <div className="step-icon">
              <div className="icon-circle">3</div>
            </div>
            <div className="step-content">
              <h4>审批驳回/取消 - 释放预算</h4>
              <p>申请被驳回或取消时，释放之前占用的预算额度</p>
              <div className="formula">可用余额 += 释放金额，已占用 -= 释放金额</div>
            </div>
          </div>
          <div className="logic-step">
            <div className="step-icon">
              <div className="icon-circle">4</div>
            </div>
            <div className="step-content">
              <h4>部分执行 - 分次扣减</h4>
              <p>支持分批执行，每次实际采购时按实扣减对应预算</p>
              <div className="formula">按实际采购金额分次扣减预算</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Usage Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">预算占用明细</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>预算编号</th>
              <th>预算名称</th>
              <th>总预算</th>
              <th>已占用</th>
              <th>已使用</th>
              <th>可用余额</th>
              <th>使用率</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {usageData.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">{item.budgetCode}</td>
                <td>{item.budgetName}</td>
                <td>{formatCurrency(item.totalBudget)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-warning" />
                    {formatCurrency(item.occupied)}
                  </div>
                </td>
                <td>{formatCurrency(item.used)}</td>
                <td className="text-success font-bold">{formatCurrency(item.available)}</td>
                <td>
                  <div className="progress" style={{ width: '100px' }}>
                    <div
                      className="progress-bar"
                      style={{ width: `${item.usageRate}%`, background: '#0071e3' }}
                    />
                  </div>
                  <span className="text-sm ml-2">{item.usageRate}%</span>
                </td>
                <td>
                  <span className={`tag ${item.usageRate > 80 ? 'tag-warning' : 'tag-success'}`}>
                    {item.usageRate > 80 ? '紧张' : '充足'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Activities */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">最近活动</h3>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon approved">
              <TrendingUp size={16} />
            </div>
            <div className="activity-content">
              <div className="activity-title">采购申请 PR2024002 获批，扣减预算 ¥10.00 万</div>
              <div className="activity-meta">研发部 · 2024-03-25 14:30</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon pending">
              <Lock size={16} />
            </div>
            <div className="activity-content">
              <div className="activity-title">采购申请 PR2024003 提交，占用预算 ¥5.00 万</div>
              <div className="activity-meta">测试部 · 2024-03-25 10:15</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon rejected">
              <RefreshCw size={16} />
            </div>
            <div className="activity-content">
              <div className="activity-title">采购申请 PR2024001 被驳回，释放预算 ¥3.00 万</div>
              <div className="activity-meta">芯片研发组 · 2024-03-24 16:20</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}