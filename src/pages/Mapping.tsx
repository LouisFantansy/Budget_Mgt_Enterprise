import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

// Mock mapping data
const mockMappings = [
  { id: '1', budgetCode: 'BUD-2024-001', budgetName: '研发材料', purchaseNo: 'PO2024001', settlementNo: 'S2024001', status: 'matched' },
  { id: '2', budgetCode: 'BUD-2024-002', budgetName: '测试费用', purchaseNo: 'PO2024002', settlementNo: '', status: 'partial' },
  { id: '3', budgetCode: 'BUD-2024-003', budgetName: '设备租赁', purchaseNo: '', settlementNo: '', status: 'unmatched' },
  { id: '4', budgetCode: 'BUD-2024-004', budgetName: '差旅费', purchaseNo: 'PO2024003', settlementNo: 'S2024002', status: 'matched' },
]

export function Mapping() {
  const [mappings] = useState(mockMappings)

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    matched: { label: '已匹配', color: 'tag-success', icon: CheckCircle },
    partial: { label: '部分匹配', color: 'tag-warning', icon: AlertCircle },
    unmatched: { label: '未匹配', color: 'tag-danger', icon: XCircle },
  }

  return (
    <div className="mapping-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据映射</h1>
          <p className="page-subtitle">关联预算-采购-财务三单数据</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">总记录数</div>
          <div className="stat-value">{mappings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已匹配</div>
          <div className="stat-value">{mappings.filter(m => m.status === 'matched').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">部分匹配</div>
          <div className="stat-value">{mappings.filter(m => m.status === 'partial').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">未匹配</div>
          <div className="stat-value">{mappings.filter(m => m.status === 'unmatched').length}</div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">映射列表</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>预算编号</th>
              <th>预算名称</th>
              <th>采购订单</th>
              <th>财务结算单</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => {
              const status = statusLabels[mapping.status]
              return (
                <tr key={mapping.id}>
                  <td className="font-medium">{mapping.budgetCode}</td>
                  <td>{mapping.budgetName}</td>
                  <td>{mapping.purchaseNo || '-'}</td>
                  <td>{mapping.settlementNo || '-'}</td>
                  <td>
                    <span className={`tag ${status.color}`}>
                      <status.icon size={12} />
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <button className="btn-link">手动匹配</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}