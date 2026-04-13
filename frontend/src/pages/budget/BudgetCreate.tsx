import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  InputNumber,
  Table,
  Space,
  message,
  Divider,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface BudgetItem {
  key: string;
  accountId: string;
  accountName: string;
  departmentId: string;
  departmentName: string;
  projectId?: string;
  projectName?: string;
  budgetAmount: number;
  remark?: string;
}

const BudgetCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      // TODO: 调用API获取基础数据
      // const [accountsRes, deptsRes, projectsRes] = await Promise.all([
      //   masterApi.getAccounts(),
      //   masterApi.getOrganizations(),
      //   masterApi.getProjects(),
      // ]);
      // setAccounts(accountsRes);
      // setDepartments(deptsRes);
      // setProjects(projectsRes);

      // 模拟数据
      setAccounts([
        { id: '1', accountCode: 'CAPEX-001', accountName: '设备采购' },
        { id: '2', accountCode: 'CAPEX-002', accountName: '软件采购' },
        { id: '3', accountCode: 'OPEX-001', accountName: '研发服务' },
        { id: '4', accountCode: 'OPEX-002', accountName: '运营维护' },
      ]);

      setDepartments([
        { id: '1', code: 'DEPT-001', name: '研发一部' },
        { id: '2', code: 'DEPT-002', name: '研发二部' },
        { id: '3', code: 'DEPT-003', name: '研发三部' },
      ]);

      setProjects([
        { id: '1', projectCode: 'IPD-001', projectName: '芯片开发项目' },
        { id: '2', projectCode: 'IPD-002', projectName: '工艺优化项目' },
      ]);
    } catch (error) {
      message.error('获取基础数据失败');
    }
  };

  const handleAddItem = () => {
    const newItem: BudgetItem = {
      key: Date.now().toString(),
      accountId: '',
      accountName: '',
      departmentId: '',
      departmentName: '',
      budgetAmount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const handleItemChange = (key: string, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.key === key) {
          if (field === 'accountId') {
            const account = accounts.find((a) => a.id === value);
            return {
              ...item,
              accountId: value,
              accountName: account?.accountName || '',
            };
          }
          if (field === 'departmentId') {
            const dept = departments.find((d) => d.id === value);
            return {
              ...item,
              departmentId: value,
              departmentName: dept?.name || '',
            };
          }
          if (field === 'projectId') {
            const project = projects.find((p) => p.id === value);
            return {
              ...item,
              projectId: value,
              projectName: project?.projectName || '',
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      message.error('请添加预算明细');
      return;
    }

    setLoading(true);
    try {
      void values;
      // TODO: 调用API创建预算
      // await budgetApi.create({
      //   ...values,
      //   items: items.map((item) => ({
      //     accountId: item.accountId,
      //     departmentId: item.departmentId,
      //     projectId: item.projectId,
      //     budgetAmount: item.budgetAmount,
      //     remark: item.remark,
      //   })),
      // });

      message.success('创建成功');
      navigate('/budget');
    } catch (error) {
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<BudgetItem> = [
    {
      title: '预算科目',
      dataIndex: 'accountId',
      key: 'accountId',
      width: 200,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(val) => handleItemChange(record.key, 'accountId', val)}
          className="w-full"
          showSearch
          optionFilterProp="children"
          options={accounts.map((a) => ({
            value: a.id,
            label: `${a.accountCode} - ${a.accountName}`,
          }))}
        />
      ),
    },
    {
      title: '二级部门',
      dataIndex: 'departmentId',
      key: 'departmentId',
      width: 150,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(val) => handleItemChange(record.key, 'departmentId', val)}
          className="w-full"
          showSearch
          optionFilterProp="children"
          options={departments.map((d) => ({
            value: d.id,
            label: d.name,
          }))}
        />
      ),
    },
    {
      title: 'IPD项目',
      dataIndex: 'projectId',
      key: 'projectId',
      width: 150,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(val) => handleItemChange(record.key, 'projectId', val)}
          className="w-full"
          allowClear
          showSearch
          optionFilterProp="children"
          options={projects.map((p) => ({
            value: p.id,
            label: p.projectName,
          }))}
        />
      ),
    },
    {
      title: '预算金额',
      dataIndex: 'budgetAmount',
      key: 'budgetAmount',
      width: 150,
      render: (value, record) => (
        <InputNumber
          value={value}
          onChange={(val) => handleItemChange(record.key, 'budgetAmount', val)}
          className="w-full"
          min={0}
          precision={2}
          formatter={(val) => `¥ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(val) => val!.replace(/¥\s?|(,*)/g, '') as any}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) =>
            handleItemChange(record.key, 'remark', e.target.value)
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(record.key)}
        />
      ),
    },
  ];

  const totalAmount = items.reduce((sum, item) => sum + item.budgetAmount, 0);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">预算编制</h2>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          budgetYear: new Date().getFullYear(),
          budgetType: 'CAPEX',
        }}
      >
        <Card className="shadow-sm mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="budgetYear"
                label="预算年度"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 2025, label: '2025年' },
                    { value: 2024, label: '2024年' },
                    { value: 2023, label: '2023年' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="budgetType"
                label="预算类型"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'CAPEX', label: 'CAPEX (资本性支出)' },
                    { value: 'OPEX', label: 'OPEX (运营性支出)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="organizationId"
                label="组织"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: '1', label: '研发部门' },
                    { value: '2', label: '市场部门' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="说明">
            <TextArea rows={2} placeholder="请输入预算说明" />
          </Form.Item>
        </Card>

        <Card
          className="shadow-sm mb-4"
          title="预算明细"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
              添加明细
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={items}
            rowKey="key"
            pagination={false}
            scroll={{ x: 1000 }}
          />

          <Divider />

          <div className="text-right">
            <span className="text-lg font-semibold">
              预算总额: ¥{totalAmount.toLocaleString()}
            </span>
          </div>
        </Card>

        <div className="text-center">
          <Space>
            <Button onClick={() => navigate('/budget')}>取消</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              保存
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default BudgetCreate;
