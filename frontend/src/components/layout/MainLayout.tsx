import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout>
        <Header />
        <Content className="p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[calc(100vh-180px)]">
            <Outlet />
          </div>
        </Content>
        <Footer className="text-center bg-white border-t border-gray-100">
          <div className="text-gray-500 text-sm">
            预算管理系统 ©{new Date().getFullYear()} Created by Budget Management Team
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
