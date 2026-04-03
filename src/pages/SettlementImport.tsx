import { useState, useRef } from 'react'
import { Upload, FileText, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { importExportApi } from '../api/modules/import-export.api'
import type { ImportResult } from '../api/modules/import-export.api'

export function SettlementImport() {
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError('')
    setSuccess('')
    setImportResult(null)

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      setError('请上传 Excel 文件 (.xlsx 或 .xls)')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const result = await importExportApi.importSettlements(file, (percent) => {
        setUploadProgress(percent)
      })
      
      setImportResult(result)
      
      if (result.success) {
        if (result.failedRows > 0) {
          setSuccess(`部分导入成功：成功 ${result.successRows} 条，失败 ${result.failedRows} 条`)
        } else {
          setSuccess(`成功导入 ${result.successRows} 条财务结算单`)
        }
      } else {
        setError(`导入失败：${result.failedRows} 条数据存在问题`)
      }
    } catch (err: any) {
      console.error('Import failed:', err)
      setError(err.response?.data?.message || '文件导入失败，请检查文件格式')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await importExportApi.downloadTemplate('settlements')
    } catch (err: any) {
      console.error('Download template failed:', err)
      setError('下载模板失败')
    }
  }

  const handleClear = () => {
    setFileName('')
    setError('')
    setSuccess('')
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="import-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">财务结算单导入</h1>
          <p className="page-subtitle">从Excel导入财务结算单数据</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">上传文件</h3>
          <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
            <Download size={16} /> 下载模板
          </button>
        </div>

        <div 
          className={`upload-area ${uploading ? 'disabled' : ''}`} 
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="spinner" size={48} />
              <p>正在导入... {uploadProgress}%</p>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            </>
          ) : (
            <>
              <Upload size={48} />
              <p>点击或拖拽文件到此处上传</p>
              <span>支持 .xlsx, .xls 格式</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </div>

        {fileName && (
          <div className="file-info">
            <FileText size={20} />
            <span>{fileName}</span>
            {!uploading && (
              <button className="btn-link" onClick={handleClear}>清除</button>
            )}
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

      {/* Import Result */}
      {importResult && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">导入结果</h3>
          </div>
          <div className="result-summary">
            <div className="result-item">
              <span className="result-label">总行数</span>
              <span className="result-value">{importResult.totalRows}</span>
            </div>
            <div className="result-item success">
              <span className="result-label">成功</span>
              <span className="result-value">{importResult.successRows}</span>
            </div>
            <div className="result-item error">
              <span className="result-label">失败</span>
              <span className="result-value">{importResult.failedRows}</span>
            </div>
          </div>

          {/* Error List */}
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="error-list">
              <h4>错误详情</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>行号</th>
                    <th>列名</th>
                    <th>错误信息</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.errors.slice(0, 20).map((err, index) => (
                    <tr key={index}>
                      <td>第 {err.row} 行</td>
                      <td>{err.column}</td>
                      <td className="text-danger">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importResult.errors.length > 20 && (
                <div className="text-center text-secondary mt-4">
                  ... 共 {importResult.errors.length} 条错误
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">导入说明</h3>
        </div>
        <div className="import-instructions">
          <ol>
            <li>点击"下载模板"获取标准导入模板</li>
            <li>按照模板格式填写财务结算单数据</li>
            <li>点击上传区域选择填写好的 Excel 文件</li>
            <li>系统将自动验证并导入数据</li>
            <li>如有错误，请根据错误提示修改后重新上传</li>
          </ol>
          <div className="instruction-note">
            <strong>注意事项：</strong>
            <ul>
              <li>结算单号为必填项，且不能重复</li>
              <li>金额必须为数字，且大于0</li>
              <li>日期格式为：YYYY-MM-DD</li>
              <li>供应商名称为必填项</li>
              <li>如有关联的采购订单号，请确保系统中已存在</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
