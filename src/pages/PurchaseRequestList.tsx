import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, ArrowRight, Edit, Trash2 } from 'lucide-react'

interface PurchaseRequest {
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
  currentStep: number
  createdAt: string
}

const mockRequests: PurchaseRequest[] = [
  {
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
    currentStep: 2,
    createdAt: '2024-03-20',
  },
  {
    id: '2',
    requestNo: 'PR2024002',
    applicant: '李四',
    department: '测试部',
    budgetItem: 'BUD-2024-002',
    itemName: '测试设备',
    specification: 'Model-X',
    quantity: 1,
    unitPrice: 100000,
    totalAmount: 100000,
    purpose: '实验室升级',
    status: 'approved',
    currentStep: 5,
    createdAt: '2024-03-18',
  },
]

export function PurchaseRequestList() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState(mockRequests)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(2)}万`

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: '草稿', color: 'tag-primary', icon: FileText },
    pending: { label: '审批中', color: 'tag-warning', icon: Clock },
    approved: { label: '已批准', color: 'tag-success', icon: CheckCircle },
    rejected: { label: '已拒绝', color: 'tag-danger', icon: XCircle },
  }

  const stepLabels = ['需求人', '部门负责人', '预算管理员', '财务', '采购部']

  const handleDelete = (request: PurchaseRequest) => {
    if (!confirm(`确定要删除采购申请 "${request.requestNo}" 吗？此操作不可恢复！`)) return
    if (request.status !== 'draft' && request.status !== 'rejected') {
      alert('只能删除草稿或被拒绝的申请单')
      return
    }
    setRequests(requests.filter(r => r.id !== request.id))
  }

  return (
    <div className="purchase-request-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">采购申请</h1>
          <p className="page-subtitle">在线提交和管理采购申请单</p>
        </div>
        <Link to="/purchase/create" className="btn btn-primary">
          <Plus size={16} />
          新建申请
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input"
              placeholder="搜索申请单号、申请人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">审批中</option>
            <option value="approved">已批准</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">申请列表</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>申请单号</th>
              <th>申请人</th>
              <th>部门</th>
              <th>采购物品</th>
              <th>金额</th>
              <th>当前步骤</th>
              <th>状态</th>
              <th>申请日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const status = statusLabels[request.status]
              return (
                <tr key={request.id}>
                  <td className="font-medium">{request.requestNo}</td>
                  <td>{request.applicant}</td>
                  <td>{request.department}</td>
                  <td>{request.itemName}</td>
                  <td>{formatCurrency(request.totalAmount)}</td>
                  <td>
                    <span className="tag tag-warning">{stepLabels[request.currentStep - 1]}</span>
                  </td>
                  <td>
                    <span className={`tag ${status.color}`}>
                      <status.icon size={12} />
                      {status.label}
                    </span>
                  </td>
                  <td>{request.createdAt}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/purchase/${request.id}`} className="btn-link-sm">
                        查看 <ArrowRight size={12} />
                      </Link>
                      {(request.status === 'draft' || request.status === 'rejected') && (
                        <>
                          <button 
                            className="btn-icon-sm" 
                            title="编辑"
                            onClick={() => navigate(`/purchase/create?edit=${request.id}`)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-icon-sm" 
                            title="删除"
                            onClick={() => handleDelete(request)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid mt-4">
        <div className="stat-card">
          <div className="stat-label">待我审批</div>
          <div className="stat-value text-warning">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月申请</div>
          <div className="stat-value">15</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月批准</div>
          <div className="stat-value text-success">12</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">总金额</div>
          <div className="stat-value">¥150 万</div>
        </div>
      </div>
    </div>
  )
}