import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Badge } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenu = (
    <Menu style={{ borderRadius: 8, padding: 4 }}>
      <Menu.Item key="profile" icon={<UserOutlined />} style={{ borderRadius: 4 }}>
        个人信息
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} style={{ borderRadius: 4 }}>
        系统设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} style={{ borderRadius: 4 }}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <AntHeader style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      {/* 左侧标题 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          fontSize: 24,
        }}>
          💰
        </div>
        <h1 style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#fff',
          margin: 0,
          letterSpacing: 0.5,
        }}>
          预算管理系统
        </h1>
      </div>

      {/* 右侧操作区 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* 通知图标 */}
        <Badge count={3} size="small">
          <div style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: 8,
            transition: 'background 0.3s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <BellOutlined style={{ fontSize: 18, color: '#fff' }} />
          </div>
        </Badge>

        {/* 用户信息 */}
        <Dropdown overlay={userMenu} placement="bottomRight">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 8,
            transition: 'background 0.3s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Space>
              <Avatar
                size={32}
                icon={<UserOutlined />}
                style={{ background: 'rgba(255,255,255,0.3)' }}
              />
              <span style={{ color: '#fff', fontWeight: 500 }}>
                {user?.realName || user?.username}
              </span>
            </Space>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
