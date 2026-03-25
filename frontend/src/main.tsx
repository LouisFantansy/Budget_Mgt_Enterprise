import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import App from './App';
import './styles/index.css';

// 苹果风格主题配置
const themeConfig = {
  token: {
    // 色彩
    colorPrimary: '#007AFF', // Apple Blue
    colorSuccess: '#34C759',
    colorWarning: '#FF9500',
    colorError: '#FF3B30',
    colorInfo: '#007AFF',
    
    // 字体
    fontFamily: 'PingFang SC, SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 34,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,
    fontSizeHeading4: 20,
    fontSizeHeading5: 17,
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 8,
    paddingXS: 4,
    
    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.12)',
    
    // 动画
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Button: {
      controlHeight: 44, // 触控友好的高度
      fontWeight: 500,
    },
    Input: {
      controlHeight: 44,
      paddingInline: 12,
    },
    Select: {
      controlHeight: 44,
    },
    Table: {
      headerBg: '#F2F2F7',
      rowHoverBg: '#F2F2F7',
      borderColor: '#C6C6C8',
    },
    Card: {
      paddingLG: 16,
      borderRadiusLG: 12,
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider locale={zhCN} theme={themeConfig}>
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
