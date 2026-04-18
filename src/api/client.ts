import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API 基础 URL（从环境变量读取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 超时时间
const REQUEST_TIMEOUT = 30000; // 30 秒

/**
 * 创建 Axios 实例
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加 Token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 添加请求时间戳（可选，用于防止缓存）
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now(),
        };
      }

      return config;
    },
    (error) => {
      console.error('请求错误:', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 直接返回响应数据
      return response;
    },
    (error: AxiosError) => {
      // 统一错误处理
      if (error.response) {
        const status = error.response.status;
        
        switch (status) {
          case 400:
            console.error('请求参数错误');
            break;
          case 401:
            console.error('未授权，请重新登录');
            // 清除 Token 但不跳转（让路由守卫处理）
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // 不要在这里跳转，避免循环刷新
            break;
          case 403:
            console.error('拒绝访问');
            break;
          case 404:
            console.error('请求资源不存在');
            break;
          case 500:
            console.error('服务器错误');
            break;
          case 502:
            console.error('网关错误');
            break;
          case 503:
            console.error('服务不可用');
            break;
          default:
            console.error(`请求失败：${status}`);
        }
      } else if (error.request) {
        console.error('网络错误，请检查网络连接');
      } else {
        console.error('请求错误:', error.message);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// 导出 Axios 实例
export const apiClient = createAxiosInstance();

/**
 * 封装 GET 请求
 */
export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config);
};

/**
 * 封装 POST 请求
 */
export const post = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.post<T>(url, data, config);
};

/**
 * 封装 PUT 请求
 */
export const put = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.put<T>(url, data, config);
};

/**
 * 封装 DELETE 请求
 */
export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.delete<T>(url, config);
};

/**
 * 封装文件下载请求
 */
export const download = async (url: string, filename: string): Promise<void> => {
  const response = await apiClient.get(url, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

/**
 * 封装文件上传请求
 */
export const upload = async (
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
};

export default apiClient;
