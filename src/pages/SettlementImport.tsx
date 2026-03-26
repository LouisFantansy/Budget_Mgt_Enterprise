import { useState, useRef } from 'react'
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Settlement {
  settlementNo: string
  invoiceNo: string
  amount: number
  date: string
  supplier: string
  budgetCode: string
}

export function SettlementImport() {
  const [fileName, setFileName] = useState('')
  const [data, setData] = useState<Settlement[]>([])
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

        const settlements: Settlement[] = jsonData.map((row: any) => ({
          settlementNo: row['结算单号'] || row['settlementNo'] || '',
          invoiceNo: row['发票号'] || row['invoiceNo'] || '',
          amount: Number(row['金额'] || row['amount'] || 0),
          date: row['日期'] || row['date'] || '',
          supplier: row['供应商'] || row['supplier'] || '',
          budgetCode: row['预算编号'] || row['budgetCode'] || '',
        }))

        setData(settlements)
        setSuccess(`成功导入 ${settlements.length} 条财务结算单`)
      } catch (err) {
        setError('文件解析失败，请检查文件格式')
        setData([])
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = () => {
    if (data.length === 0) return
    console.log('Importing data:', data)
    setSuccess(`成功导入 ${data.length} 条财务结算单到系统`)
    setData([])
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadTemplate = () => {
    const template = [
      { 结算单号: 'S2024001', 发票号: 'INV2024001', 金额: 50000, 日期: '2024-01-15', 供应商: '供应商A', 预算编号: 'BUD-2024-001' },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, '财务结算单导入模板.xlsx')
  }

  return (
    <div className="import-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">财务结算单导入</h1>
          <p className="page-subtitle">从Excel导入财务结算单数据</p>
        </div>
      </div>

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
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>

        {fileName && (
          <div className="file-info">
            <FileText size={20} />
            <span>{fileName}</span>
          </div>
        )}

        {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="alert alert-success"><CheckCircle size={16} /> {success}</div>}
      </div>

      {data.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">数据预览</h3>
            <button className="btn btn-primary" onClick={handleImport}>确认导入</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>结算单号</th>
                <th>发票号</th>
                <th>金额</th>
                <th>日期</th>
                <th>供应商</th>
                <th>预算编号</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, index) => (
                <tr key={index}>
                  <td>{row.settlementNo}</td>
                  <td>{row.invoiceNo}</td>
                  <td>¥{row.amount.toLocaleString()}</td>
                  <td>{row.date}</td>
                  <td>{row.supplier}</td>
                  <td>{row.budgetCode || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && <div className="text-center text-secondary mt-4">... 共 {data.length} 条数据</div>}
        </div>
      )}
    </div>
  )
}