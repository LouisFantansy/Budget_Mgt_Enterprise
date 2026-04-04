import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, User, Loader2 } from 'lucide-react'
import { approvalApi } from '../api/modules/approval.api'

interface ApprovalItem {
  id: string
  targetType: string
  title: string
  department: string
  amount: number
  applicant: string
  status: string
  currentStep: number
}

export function Approval() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchApprovals()
  }, [activeTab])

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      let response: any
      if (activeTab === 'pending') {
        response = await approvalApi.getPendingList({ page: 1, pageSize: 50 })
      } else {
        response = await approvalApi.getMyList({ page: 1, pageSize: 50, status: activeTab.toUpperCase() as any })
      }
      if (response && response.data) {
        const items = response.data.data?.items || []
        setApprovals(items)
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approvalApi.approve(id, { comment: '审批通过' })
      await fetchApprovals()
    } catch (err) {
      console.error('Failed to approve:', err)
      alert('审批失败')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('请输入拒绝原因：')
    if (!reason) return
    try {
      await approvalApi.reject(id, { reason })
      await fetchApprovals()
    } catch (err) {
      console.error('Failed to reject:', err)
      alert('拒绝失败')
    }
  }

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING')
  const approvedApprovals = approvals.filter(a => a.status === 'APPROVED')
  const rejectedApprovals = approvals.filter(a => a.status === 'REJECTED')

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(0)}万`

  const stepLabels = ['部门负责人', '预算管理员', '财务', '总经理']
  const typeLabels: Record<string, string> = {
    BUDGET: '预算申请',
    PURCHASE: '采购申请',
    ADJUSTMENT: '预算调整',
  }

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
        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={32} />
            <p>加载中...</p>
          </div>
        ) : (
          <>
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
                      <td><span className="tag tag-primary">{typeLabels[approval.targetType] || approval.targetType}</span></td>
                      <td className="font-medium">{approval.title}</td>
                      <td>{approval.department}</td>
                      <td>{formatCurrency(approval.amount)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User size={14} /> {approval.applicant}
                        </div>
                      </td>
                      <td>
                        <span className="tag tag-warning">{stepLabels[approval.currentStep - 1] || '审批中'}</span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(approval.id)}>通过</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleReject(approval.id)}>拒绝</button>
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
                <p>{approvedApprovals.length > 0 ? `已通过 ${approvedApprovals.length} 条审批` : '暂无已通过的审批记录'}</p>
              </div>
            )}
            {activeTab === 'rejected' && (
              <div className="empty-state">
                <XCircle size={48} />
                <p>{rejectedApprovals.length > 0 ? `已拒绝 ${rejectedApprovals.length} 条审批` : '暂无已拒绝的审批记录'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}