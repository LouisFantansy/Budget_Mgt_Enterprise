import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  SettingOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAppSelector((s) => s.auth);

  const roleCodes = user?.roles?.map((r) => r.code) || [];
  const canSeePo =
    roleCodes.includes('FINANCE') ||
    roleCodes.includes('ADMIN');
  const canManageMaster = roleCodes.length > 0;
  const canManageSystem = roleCodes.includes('ADMIN');

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/budget',
      icon: <DollarOutlined />,
      label: '预算管理',
      children: [
        { key: '/budget/list', label: '预算列表' },
        { key: '/budget/create', label: '预算编制' },
        { key: '/budget/adjustment', label: '预算调整' },
      ],
    },
    {
      key: '/execution',
      icon: <ShoppingCartOutlined />,
      label: '预算执行',
      children: [
        { key: '/execution/import', label: canSeePo ? 'PR/PO/结算导入' : 'PR导入' },
      ],
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: '差异分析',
      children: [
        { key: '/analysis/variance', label: '差异分析' },
      ],
    },
    canManageMaster && {
      key: '/master',
      icon: <FolderOutlined />,
      label: '基础数据',
      children: [
        { key: '/master/organization', label: '组织架构' },
        { key: '/master/accounts', label: '预算科目' },
      ],
    },
    canManageSystem && {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: '/system/users', label: '用户管理' },
        { key: '/system/roles', label: '角色管理' },
        { key: '/system/logs', label: '操作日志' },
      ],
    },
  ].filter(Boolean) as any[];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="bg-white shadow-sm"
      theme="light"
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        {collapsed ? (
          <DollarOutlined className="text-2xl text-blue-500" />
        ) : (
          <h2 className="text-lg font-semibold text-blue-500 m-0">
            Budget Mgt
          </h2>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['/budget', '/execution', '/analysis']}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-r-0"
      />
    </Sider>
  );
};

export default Sidebar;
