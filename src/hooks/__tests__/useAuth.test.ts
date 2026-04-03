import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { authApi } from '../../api/modules/auth.api';

// Mock authApi
vi.mock('../../api/modules/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('成功登录应设置用户状态', async () => {
      const mockUser = { id: '1', username: 'testuser', role: 'USER' };
      const mockResponse = {
        data: {
          token: 'test-token-123',
          user: mockUser,
        },
      };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({
          username: 'testuser',
          password: 'password123',
        });
      });

      expect(authApi.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(loginResult).toEqual({
        token: 'test-token-123',
        user: mockUser,
      });
      expect(localStorage.getItem('token')).toBe('test-token-123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('失败时应抛出错误', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(authApi.login).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.login({
            username: 'testuser',
            password: 'wrongpassword',
          });
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('应清除用户状态', async () => {
      // 先设置一些本地存储数据
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', username: 'test' }));

      vi.mocked(authApi.logout).mockResolvedValue({ data: null } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('即使API调用失败也应清除本地存储', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', username: 'test' }));

      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('有token时应返回true', () => {
      localStorage.setItem('token', 'valid-token');

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated()).toBe(true);
    });

    it('无token时应返回false', () => {
      localStorage.removeItem('token');

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated()).toBe(false);
    });
  });

  describe('getUserInfo', () => {
    it('应返回存储的用户信息', () => {
      const mockUser = { id: '1', username: 'testuser', role: 'ADMIN' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth());

      expect(result.current.getUserInfo()).toEqual(mockUser);
    });

    it('无用户信息时应返回null', () => {
      localStorage.removeItem('user');

      const { result } = renderHook(() => useAuth());

      expect(result.current.getUserInfo()).toBeNull();
    });

    it('解析失败时应返回null', () => {
      localStorage.setItem('user', 'invalid-json');

      const { result } = renderHook(() => useAuth());

      expect(result.current.getUserInfo()).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('应调用changePassword API', async () => {
      vi.mocked(authApi.changePassword).mockResolvedValue({ data: null } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.changePassword({
          oldPassword: 'oldpass',
          newPassword: 'newpass',
        });
      });

      expect(authApi.changePassword).toHaveBeenCalledWith({
        oldPassword: 'oldpass',
        newPassword: 'newpass',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('应返回当前用户信息', async () => {
      const mockUser = { id: '1', username: 'testuser', role: 'USER' };
      vi.mocked(authApi.getCurrentUser).mockResolvedValue({ data: mockUser } as any);

      const { result } = renderHook(() => useAuth());

      let user;
      await act(async () => {
        user = await result.current.getCurrentUser();
      });

      expect(user).toEqual(mockUser);
      expect(authApi.getCurrentUser).toHaveBeenCalled();
    });
  });
});
