import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, ArrowRight, Edit, Trash2, Loader2 } from 'lucide-react'
import { purchaseApi } from '../api/modules/purchase.api'

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

const mockRequests: PurchaseRequest[] = []

export function PurchaseRequestList() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = (await purchaseApi.getList({ 
        page: 1, 
        pageSize: 50,
        status: statusFilter.toUpperCase() as any || undefined 
      })) as any
      // API 响应解包：统一处理响应格式
      const responseData = response?.data?.data || response?.data || {}
      const items = responseData?.items || []
      setRequests(Array.isArray(items) ? items : [])
    } catch (err) {
      console.error('Failed to fetch purchase requests:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (request: PurchaseRequest) => {
    if (!confirm(`确定要删除采购申请 "${request.requestNo}" 吗？此操作不可恢复！`)) return
    if (request.status !== 'DRAFT' && request.status !== 'REJECTED') {
      alert('只能删除草稿或被拒绝的申请单')
      return
    }
    try {
      await purchaseApi.remove(request.id)
      await fetchRequests()
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('删除失败')
    }
  }

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(2)}万`

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: '草稿', color: 'tag-primary', icon: FileText },
    pending: { label: '审批中', color: 'tag-warning', icon: Clock },
    approved: { label: '已批准', color: 'tag-success', icon: CheckCircle },
    rejected: { label: '已拒绝', color: 'tag-danger', icon: XCircle },
  }

  const stepLabels = ['需求人', '部门负责人', '预算管理员', '财务', '采购部']

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
        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={32} />
            <p>加载中...</p>
          </div>
        ) : (
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
                const status = statusLabels[request.status.toLowerCase()]
                return (
                  <tr key={request.id}>
                    <td className="font-medium">{request.requestNo}</td>
                    <td>{request.applicant}</td>
                    <td>{request.department}</td>
                    <td>{request.itemName}</td>
                    <td>{formatCurrency(request.totalAmount)}</td>
                    <td>
                      <span className="tag tag-warning">{stepLabels[request.currentStep - 1] || '审批中'}</span>
                    </td>
                    <td>
                      <span className={`tag ${status?.color || 'tag-primary'}`}>
                        {status?.icon && <status.icon size={12} />}
                        {status?.label || request.status}
                      </span>
                    </td>
                    <td>{request.createdAt}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/purchase/${request.id}`} className="btn-link-sm">
                          查看 <ArrowRight size={12} />
                        </Link>
                        {(request.status === 'DRAFT' || request.status === 'REJECTED') && (
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
        )}
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