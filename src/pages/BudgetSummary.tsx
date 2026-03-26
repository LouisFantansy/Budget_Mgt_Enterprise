import { useState } from 'react'
import { FileText, Download, Eye, Edit, Trash2 } from 'lucide-react'

interface BudgetSummary {
  id: string
  version: string
  department: string
  type: string
  totalAmount: number
  status: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

const mockSummaries: BudgetSummary[] = [
  {
    id: '1',
    version: 'V1.0',
    department: '研发事业部',
    type: 'Opex',
    totalAmount: 15000000,
    status: 'approved',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-28',
    createdBy: '张预算',
  },
  {
    id: '2',
    version: 'V2.0',
    department: '研发事业部',
    type: 'Capex',
    totalAmount: 8000000,
    status: 'pending',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-05',
    createdBy: '张预算',
  },
]

export function BudgetSummary() {
  const [summaries] = useState(mockSummaries)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const formatCurrency = (value: number) => `¥${(value / 10000).toFixed(0)}万`

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'tag-primary' },
    pending: { label: '审批中', color: 'tag-warning' },
    approved: { label: '已批准', color: 'tag-success' },
    rejected: { label: '已拒绝', color: 'tag-danger' },
  }

  return (
    <div className="budget-summary-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">预算汇总</h1>
          <p className="page-subtitle">查看各部门预算汇总报表</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="filters-row">
          <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: '150px' }}>
            <option value="">全部类型</option>
            <option value="Opex">Opex</option>
            <option value="Capex">Capex</option>
          </select>
          <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '150px' }}>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">审批中</option>
            <option value="approved">已批准</option>
          </select>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">预算汇总表</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>版本</th>
              <th>部门</th>
              <th>类型</th>
              <th>总金额</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.id}>
                <td className="font-medium">{summary.version}</td>
                <td>{summary.department}</td>
                <td>
                  <span className={`tag ${summary.type === 'Capex' ? 'tag-primary' : 'tag-success'}`}>
                    {summary.type}
                  </span>
                </td>
                <td>{formatCurrency(summary.totalAmount)}</td>
                <td>
                  <span className={`tag ${statusLabels[summary.status].color}`}>
                    {statusLabels[summary.status].label}
                  </span>
                </td>
                <td>{summary.createdBy}</td>
                <td>{summary.createdAt}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon-sm" title="查看">
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon-sm" title="下载">
                      <Download size={14} />
                    </button>
                    {summary.status === 'draft' && (
                      <>
                        <button className="btn-icon-sm" title="编辑">
                          <Edit size={14} />
                        </button>
                        <button className="btn-icon-sm" title="删除">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Department Breakdown */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">部门明细</h3>
        </div>
        <div className="dept-breakdown">
          <div className="dept-card">
            <div className="dept-card-header">
              <FileText size={20} />
              <span className="dept-name">研发部</span>
            </div>
            <div className="dept-card-body">
              <div className="stat-row">
                <span className="stat-label">Opex:</span>
                <span className="stat-value">¥1,200 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Capex:</span>
                <span className="stat-value">¥800 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">总计:</span>
                <span className="stat-value text-primary">¥2,000 万</span>
              </div>
            </div>
          </div>
          <div className="dept-card">
            <div className="dept-card-header">
              <FileText size={20} />
              <span className="dept-name">测试部</span>
            </div>
            <div className="dept-card-body">
              <div className="stat-row">
                <span className="stat-label">Opex:</span>
                <span className="stat-value">¥600 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Capex:</span>
                <span className="stat-value">¥400 万</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">总计:</span>
                <span className="stat-value text-primary">¥1,000 万</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}