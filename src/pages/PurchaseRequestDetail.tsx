import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { purchaseApi } from '../api/modules/purchase.api'
import { approvalApi } from '../api/modules/approval.api'

interface ApprovalStep {
  step: number
  role: string
  user: string
  status: 'pending' | 'approved' | 'rejected'
  date?: string
  comment?: string
}

interface PurchaseRequestDetail {
  id: string
  requestNo: string
  applicant: string
  department: string
  budgetItem: string
  itemName: string
  specification: string
  quantity: number
  unitPrice: number
  totalAmount: number
  purpose: string
  status: string
  approvals: ApprovalStep[]
  createdAt: string
}

export function PurchaseRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const [request, setRequest] = useState<PurchaseRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (id) {
      fetchRequest()
    }
  }, [id])

  const fetchRequest = async () => {
    try {
      setLoading(true)
      const response = await purchaseApi.getById(id!) as any
      if (response && response.data) {
        setRequest(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch request:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (action: 'approved' | 'rejected') => {
    if (!id) return
    try {
      if (action === 'approved') {
        await approvalApi.approve(id, { comment })
      } else {
        await approvalApi.reject(id, { reason: comment || '审批拒绝' })
      }
      alert(`已${action === 'approved' ? '批准' : '拒绝'}该申请`)
      await fetchRequest()
    } catch (err) {
      console.error('Approval failed:', err)
      alert('审批操作失败')
    }
  }

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(2)}万`

  if (loading) {
    return (
      <div className="purchase-detail-page">
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="purchase-detail-page">
        <div className="error-container">
          <p>未找到采购申请</p>
          <Link to="/purchase" className="btn btn-primary">返回列表</Link>
        </div>
      </div>
    )
  }

  const currentStep = request.approvals?.find(a => a.status === 'pending')
  const canApprove = currentStep && currentStep.step === 2

  return (
    <div className="purchase-detail-page">
      <div className="page-header">
        <div>
          <Link to="/purchase" className="back-link">
            <ArrowLeft size={16} /> 返回列表
          </Link>
          <h1 className="page-title">采购申请详情</h1>
        </div>
      </div>

      {/* Request Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">申请信息</h3>
          <span className={`tag ${request.status === 'approved' ? 'tag-success' : 'tag-warning'}`}>
            {request.status === 'approved' ? '已批准' : '审批中'}
          </span>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">申请单号</span>
            <span className="info-value">{request.requestNo}</span>
          </div>
          <div className="info-item">
            <span className="info-label">申请人</span>
            <span className="info-value">{request.applicant}</span>
          </div>
          <div className="info-item">
            <span className="info-label">申请部门</span>
            <span className="info-value">{request.department}</span>
          </div>
          <div className="info-item">
            <span className="info-label">申请日期</span>
            <span className="info-value">{request.createdAt}</span>
          </div>
        </div>
      </div>

      {/* Budget Item */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">关联预算条目</h3>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">预算编号</span>
            <span className="info-value">{request.budgetItem}</span>
          </div>
          <div className="info-item">
            <span className="info-label">预算余额</span>
            <span className="info-value text-success">¥100.00 万</span>
          </div>
        </div>
      </div>

      {/* Purchase Details */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">采购明细</h3>
        </div>
        <table className="table">
          <tbody>
            <tr>
              <td className="font-medium" style={{ width: 150 }}>采购物品</td>
              <td>{request.itemName}</td>
            </tr>
            <tr>
              <td className="font-medium">规格型号</td>
              <td>{request.specification}</td>
            </tr>
            <tr>
              <td className="font-medium">数量</td>
              <td>{request.quantity}</td>
            </tr>
            <tr>
              <td className="font-medium">单价</td>
              <td>¥{request.unitPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="font-medium">总金额</td>
              <td className="text-primary font-bold">{formatCurrency(request.totalAmount)}</td>
            </tr>
            <tr>
              <td className="font-medium">用途说明</td>
              <td>{request.purpose}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Approval Flow */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">审批流程</h3>
        </div>
        <div className="approval-flow">
          {request.approvals?.map((approval, index) => (
            <div key={index} className="approval-step-item">
              <div className={`step-icon ${approval.status}`}>
                {approval.status === 'approved' ? (
                  <CheckCircle size={20} />
                ) : approval.status === 'rejected' ? (
                  <XCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div className="step-info">
                <div className="step-role">{approval.role}</div>
                <div className="step-user">{approval.user}</div>
                {approval.date && <div className="step-date">{approval.date}</div>}
                {approval.comment && <div className="step-comment">{approval.comment}</div>}
              </div>
              {index < (request.approvals?.length || 0) - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Approval Actions */}
      {canApprove && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">审批操作</h3>
          </div>
          <div className="approval-actions">
            <div className="input-group">
              <label className="input-label">审批意见</label>
              <textarea
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入审批意见..."
                rows={3}
              />
            </div>
            <div className="action-buttons-row">
              <button className="btn btn-danger" onClick={() => handleApproval('rejected')}>
                <XCircle size={16} /> 拒绝
              </button>
              <button className="btn btn-primary" onClick={() => handleApproval('approved')}>
                <CheckCircle size={16} /> 批准
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}