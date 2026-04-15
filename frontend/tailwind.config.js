/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // 苹果风格色彩系统
      colors: {
        // 系统色
        'apple-blue': '#007AFF',
        'apple-green': '#34C759',
        'apple-orange': '#FF9500',
        'apple-red': '#FF3B30',
        'apple-purple': '#AF52DE',
        'apple-pink': '#FF2D55',
        'apple-teal': '#5AC8FA',
        'apple-indigo': '#5856D6',
        
        // 中性色
        'apple-gray': {
          50: '#F2F2F7',
          100: '#E5E5EA',
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#C6C6C8',
          500: '#8E8E93',
          600: '#636366',
          700: '#48484A',
          800: '#3A3A3C',
          900: '#1C1C1E',
        },
        
        // 语义色
        'success': '#34C759',
        'warning': '#FF9500',
        'error': '#FF3B30',
        'info': '#007AFF',
      },
      
      // 字体系统
      fontFamily: {
        'pingfang': ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        'sf': ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      
      // 间距系统（基于8px网格）
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
      },
      
      // 圆角系统
      borderRadius: {
        'apple-sm': '6px',
        'apple-md': '12px',
        'apple-lg': '20px',
      },
      
      // 阴影系统
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'apple-md': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
      
      // 动画时长
      transitionDuration: {
        'apple-fast': '100ms',
        'apple-normal': '200ms',
        'apple-slow': '300ms',
      },
    },
  },
  plugins: [],
}
