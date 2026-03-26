import { useState } from 'react'
import { CheckCircle, XCircle, User } from 'lucide-react'

// Mock approval tasks
const mockApprovals = [
  { id: '1', type: '预算申请', title: '2024年度研发部预算', department: '研发部', amount: 15000000, applicant: '李部门', status: 'pending', step: 2 },
  { id: '2', type: '预算调整', title: '研发材料预算调整', department: '研发部', amount: 2000000, applicant: '李部门', status: 'pending', step: 3 },
  { id: '3', type: '预算申请', title: '2024年度生产部设备采购', department: '生产部', amount: 8000000, applicant: '张生产', status: 'pending', step: 1 },
]

export function Approval() {
  const [approvals] = useState(mockApprovals)
  const [activeTab, setActiveTab] = useState('pending')

  const pendingApprovals = approvals.filter(a => a.status === 'pending')
  const approvedApprovals = approvals.filter(a => a.status === 'approved')
  const rejectedApprovals = approvals.filter(a => a.status === 'rejected')

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(0)}万`

  const stepLabels = ['部门负责人', '预算管理员', '财务', '总经理']

  return (
    <div className="approval-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">审批中心</h1>
          <p className="page-subtitle">处理预算审批流程</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          待审批 ({pendingApprovals.length})
        </button>
        <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
          已通过 ({approvedApprovals.length})
        </button>
        <button className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
          已拒绝 ({rejectedApprovals.length})
        </button>
      </div>

      <div className="card">
        {activeTab === 'pending' && (
          <table className="table">
            <thead>
              <tr>
                <th>类型</th>
                <th>标题</th>
                <th>部门</th>
                <th>金额</th>
                <th>申请人</th>
                <th>当前步骤</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((approval) => (
                <tr key={approval.id}>
                  <td><span className="tag tag-primary">{approval.type}</span></td>
                  <td className="font-medium">{approval.title}</td>
                  <td>{approval.department}</td>
                  <td>{formatCurrency(approval.amount)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <User size={14} /> {approval.applicant}
                    </div>
                  </td>
                  <td>
                    <span className="tag tag-warning">{stepLabels[approval.step - 1]}</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm">通过</button>
                      <button className="btn btn-secondary btn-sm">拒绝</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 'approved' && (
          <div className="empty-state">
            <CheckCircle size={48} />
            <p>暂无已通过的审批记录</p>
          </div>
        )}
        {activeTab === 'rejected' && (
          <div className="empty-state">
            <XCircle size={48} />
            <p>暂无已拒绝的审批记录</p>
          </div>
        )}
      </div>
    </div>
  )
}