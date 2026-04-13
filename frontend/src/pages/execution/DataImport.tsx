import React, { useState } from 'react';
import {
  Upload,
  Button,
  Card,
  message,
  Table,
  Alert,
  Divider,
  Progress,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  DownloadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface ImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  errors: Array<{ row: number; message: string }>;
}

const DataImport: React.FC = () => {
  const [importType, setImportType] = useState<'PR' | 'PO' | 'SETTLEMENT'>('PR');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      // TODO: 调用API下载模板
      // const response = await executionApi.downloadTemplate(importType);
      // const url = window.URL.createObjectURL(new Blob([response]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `${importType}导入模板.xlsx`);
      // document.body.appendChild(link);
      // link.click();
      // link.remove();

      message.success('模板下载成功');
    } catch (error) {
      message.error('模板下载失败');
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // TODO: 调用API导入数据
      // const response = await executionApi.importData(importType, formData);
      // setResult(response);

      // 模拟导入结果
      setTimeout(() => {
        const mockResult: ImportResult = {
          success: true,
          total: 100,
          successCount: 98,
          failCount: 2,
          errors: [
            { row: 15, message: '预算科目ID不存在' },
            { row: 42, message: 'PR金额格式不正确' },
          ],
        };
        setResult(mockResult);
        setImporting(false);
        message.success('导入完成');
      }, 2000);
    } catch (error) {
      message.error('导入失败');
      setImporting(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      handleImport(file);
      return false;
    },
  };

  const errorColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
      width: 100,
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>
        数据导入
      </h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card
            style={{ 
              borderRadius: 12, 
              boxShadow: importType === 'PR' ? '0 4px 12px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
              border: importType === 'PR' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onClick={() => setImportType('PR')}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>PR订单导入</div>
              <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>采购申请数据</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={{ 
              borderRadius: 12, 
              boxShadow: importType === 'PO' ? '0 4px 12px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
              border: importType === 'PO' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onClick={() => setImportType('PO')}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🛒</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>PO订单导入</div>
              <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>采购订单数据</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={{ 
              borderRadius: 12, 
              boxShadow: importType === 'SETTLEMENT' ? '0 4px 12px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
              border: importType === 'SETTLEMENT' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onClick={() => setImportType('SETTLEMENT')}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>结算数据导入</div>
              <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>财务结算数据</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none', marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            style={{ borderRadius: 8 }}
          >
            下载导入模板
          </Button>
        </div>

        <Divider />

        <Dragger {...uploadProps} disabled={importing} style={{ borderRadius: 8 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#667eea', fontSize: 48 }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>
            点击或拖拽文件到此区域上传
          </p>
          <p className="ant-upload-hint" style={{ color: '#666' }}>
            支持 .xlsx 或 .xls 格式文件
          </p>
        </Dragger>

        {importing && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Progress percent={50} status="active" />
            <div style={{ color: '#666', marginTop: 8 }}>正在导入数据，请稍候...</div>
          </div>
        )}
      </Card>

      {result && (
        <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
          <div style={{ marginBottom: 16 }}>
            <Alert
              message={
                result.success ? (
                  <span>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    导入成功
                  </span>
                ) : (
                  <span>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    导入完成，但存在错误
                  </span>
                )
              }
              type={result.success ? 'success' : 'warning'}
              showIcon
            />
          </div>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic title="总记录数" value={result.total} />
            </Col>
            <Col span={8}>
              <Statistic
                title="成功导入"
                value={result.successCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="失败记录"
                value={result.failCount}
                valueStyle={{ color: result.failCount > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Col>
          </Row>

          {result.errors.length > 0 && (
            <>
              <Divider />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>错误详情</h3>
              <Table
                columns={errorColumns}
                dataSource={result.errors}
                rowKey="row"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default DataImport;
