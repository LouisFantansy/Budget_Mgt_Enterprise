import { useState, useRef } from 'react'
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

interface PurchaseOrder {
  orderNo: string
  supplier: string
  amount: number
  date: string
  status: string
  budgetCode: string
}

export function PurchaseImport() {
  const [fileName, setFileName] = useState('')
  const [data, setData] = useState<PurchaseOrder[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError('')
    setSuccess('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)

        // Transform data
        const orders: PurchaseOrder[] = jsonData.map((row: any) => ({
          orderNo: row['订单号'] || row['orderNo'] || '',
          supplier: row['供应商'] || row['supplier'] || '',
          amount: Number(row['金额'] || row['amount'] || 0),
          date: row['日期'] || row['date'] || '',
          status: row['状态'] || row['status'] || '待匹配',
          budgetCode: row['预算编号'] || row['budgetCode'] || '',
        }))

        setData(orders)
        setSuccess(`成功导入 ${orders.length} 条采购订单`)
      } catch (err) {
        setError('文件解析失败，请检查文件格式')
        setData([])
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = () => {
    if (data.length === 0) return
    // In production, this would save to the backend
    console.log('Importing data:', data)
    setSuccess(`成功导入 ${data.length} 条采购订单到系统`)
    setData([])
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadTemplate = () => {
    const template = [
      { 订单号: 'PO2024001', 供应商: '供应商A', 金额: 50000, 日期: '2024-01-15', 状态: '已完成', 预算编号: 'BUD-2024-001' },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, '采购订单导入模板.xlsx')
  }

  return (
    <div className="import-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">采购订单导入</h1>
          <p className="page-subtitle">从Excel导入采购订单数据</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">上传文件</h3>
          <button className="btn btn-secondary" onClick={downloadTemplate}>
            <Download size={16} /> 下载模板
          </button>
        </div>

        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          <Upload size={48} />
          <p>点击或拖拽文件到此处上传</p>
          <span>支持 .xlsx, .xls 格式</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {fileName && (
          <div className="file-info">
            <FileText size={20} />
            <span>{fileName}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} /> {success}
          </div>
        )}
      </div>

      {/* Data Preview */}
      {data.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">数据预览</h3>
            <button className="btn btn-primary" onClick={handleImport}>
              确认导入
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>供应商</th>
                <th>金额</th>
                <th>日期</th>
                <th>状态</th>
                <th>预算编号</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, index) => (
                <tr key={index}>
                  <td>{row.orderNo}</td>
                  <td>{row.supplier}</td>
                  <td>¥{row.amount.toLocaleString()}</td>
                  <td>{row.date}</td>
                  <td>{row.status}</td>
                  <td>{row.budgetCode || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <div className="text-center text-secondary mt-4">
              ... 共 {data.length} 条数据
            </div>
          )}
        </div>
      )}
    </div>
  )
}