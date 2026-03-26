import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

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

const mockRequest: PurchaseRequestDetail = {
  id: '1',
  requestNo: 'PR2024001',
  applicant: '张三',
  department: '研发部',
  budgetItem: 'BUD-2024-001',
  itemName: '测试晶圆',
  specification: '8 inch',
  quantity: 10,
  unitPrice: 5000,
  totalAmount: 50000,
  purpose: '新产品开发验证',
  status: 'pending',
  approvals: [
    { step: 1, role: '需求人', user: '张三', status: 'approved', date: '2024-03-20', comment: '提交申请' },
    { step: 2, role: '部门负责人', user: '李部门', status: 'pending' },
    { step: 3, role: '预算管理员', user: '张预算', status: 'pending' },
    { step: 4, role: '财务', user: '王财务', status: 'pending' },
    { step: 5, role: '采购部', user: '赵采购', status: 'pending' },
  ],
  createdAt: '2024-03-20',
}

export function PurchaseRequestDetail() {
  const [request] = useState(mockRequest)
  const [comment, setComment] = useState('')

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(2)}万`

  const handleApproval = (status: 'approved' | 'rejected') => {
    console.log('Approval:', { action: status, comment })
    // In production, submit to backend
    alert(`已${status === 'approved' ? '批准' : '拒绝'}该申请`)
  }

  const currentStep = request.approvals.find(a => a.status === 'pending')
  const canApprove = currentStep && currentStep.step === 2 // Demo: assume user is dept head

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
          <h3 className="card-title">审批流程（五级）</h3>
        </div>
        <div className="approval-flow">
          {request.approvals.map((approval, index) => (
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
              {index < request.approvals.length - 1 && <div className="step-line" />}
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