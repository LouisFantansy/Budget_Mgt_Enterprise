import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import type { Notification } from '../types';

// WebSocket 服务器地址
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: <T = any>(event: string, data: T) => void;
  on: <T = any>(event: string, callback: (data: T) => void) => void;
  off: (event: string, callback?: Function) => void;
}

/**
 * WebSocket 连接管理 Hook
 */
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();

  /**
   * 建立 WebSocket 连接
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setConnecting(true);
    setError(null);

    const token = localStorage.getItem('token');
    
    socketRef.current = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // 连接成功
    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setConnecting(false);
      setError(null);
      
      // 加入用户房间
      if (user?.id) {
        socketRef.current?.emit('join', { userId: user.id });
      }
      
      onConnect?.();
    });

    // 连接断开
    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
      setConnecting(false);
      onDisconnect?.();
    });

    // 连接错误
    socketRef.current.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setConnected(false);
      setConnecting(false);
      setError(err.message);
      onError?.(err);
    });

    // 接收新通知
    socketRef.current.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);
      addNotification(notification);
    });

    // 接收通知数量更新
    socketRef.current.on('unread-count', (count: number) => {
      useNotificationStore.getState().setUnreadCount(count);
    });
  }, [user?.id, addNotification, onConnect, onDisconnect, onError]);

  /**
   * 断开 WebSocket 连接
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setConnecting(false);
    }
  }, []);

  /**
   * 发送事件
   */
  const emit = useCallback(<T = any>(event: string, data: T) => {
    socketRef.current?.emit(event, data);
  }, []);

  /**
   * 监听事件
   */
  const on = useCallback(<T = any>(event: string, callback: (data: T) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  /**
   * 移除事件监听
   */
  const off = useCallback((event: string, callback?: Function) => {
    if (callback) {
      socketRef.current?.off(event, callback as any);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect && user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user?.id, connect, disconnect]);

  // 页面可见性变化时重连
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && !connected) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, connected, connect]);

  return {
    connected,
    connecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};
