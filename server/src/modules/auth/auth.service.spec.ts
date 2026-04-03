import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// 创建 Prisma 方法的 Mock
const createMockPrisma = () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock };

  const mockUser = {
    id: 'user-id-1',
    username: 'testuser',
    password: 'hashed-password',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    status: 'ACTIVE',
    departmentId: 'dept-1',
    department: { id: 'dept-1', name: 'Test Department' },
    roles: [
      {
        role: {
          id: 'role-1',
          name: 'admin',
          displayName: '管理员',
          permissions: [
            { permission: { id: 'perm-1', name: 'budget:create' } },
            { permission: { id: 'perm-2', name: 'budget:read' } },
          ],
        },
      },
    ],
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    prisma = createMockPrisma();
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('正确密码应该返回用户信息', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      prisma.user.update.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.password).toBeUndefined();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        include: {
          department: true,
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('错误密码应该返回 null', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('禁用用户应该返回 null', async () => {
      const disabledUser = { ...mockUser, status: 'DISABLED' };
      prisma.user.findUnique.mockResolvedValue(disabledUser as any);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toBeNull();
    });

    it('不存在的用户应该返回 null', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('应该生成正确的 JWT token 和 refreshToken', async () => {
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      configService.get
        .mockReturnValueOnce('7d')
        .mockReturnValueOnce('30d');

      const result = await service.login(mockUser);

      expect(result.token).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.username).toBe('testuser');
      expect(result.user.roles).toEqual(['admin']);
      expect(result.user.permissions).toEqual(['budget:create', 'budget:read']);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: 'testuser',
          sub: 'user-id-1',
          departmentId: 'dept-1',
          roles: ['admin'],
        },
        { expiresIn: '7d' }
      );
    });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com',
        departmentId: 'dept-1',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      prisma.role.findFirst.mockResolvedValue({ id: 'default-role-id', name: 'viewer', displayName: '普通用户' } as any);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        ...registerDto,
        password: 'hashed-password',
        roles: [],
        department: { id: 'dept-1', name: 'Test Department' },
      } as any);

      const result = await service.register(registerDto);

      expect(result.username).toBe('newuser');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('用户名已存在应该抛出异常', async () => {
      const registerDto = {
        username: 'existinguser',
        password: 'password123',
        name: 'Existing User',
      };

      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' } as any);

      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.register(registerDto)).rejects.toThrow('用户名已存在');
    });
  });

  describe('changePassword', () => {
    it('应该成功修改密码', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('new-hashed-password' as never);
      prisma.user.update.mockResolvedValue(mockUser as any);

      const result = await service.changePassword('user-id-1', 'oldpassword', 'newpassword');

      expect(result.message).toBe('密码修改成功');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { password: 'new-hashed-password' },
      });
    });

    it('用户不存在应该抛出异常', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('nonexistent-id', 'oldpassword', 'newpassword'))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.changePassword('nonexistent-id', 'oldpassword', 'newpassword'))
        .rejects.toThrow('用户不存在');
    });

    it('旧密码错误应该抛出异常', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.changePassword('user-id-1', 'wrongoldpassword', 'newpassword'))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.changePassword('user-id-1', 'wrongoldpassword', 'newpassword'))
        .rejects.toThrow('旧密码错误');
    });
  });

  describe('refreshToken', () => {
    const validPayload = {
      sub: 'user-id-1',
      username: 'testuser',
      departmentId: 'dept-1',
      roles: ['admin'],
    };

    it('有效 token 应该刷新并返回新的 token', async () => {
      jwtService.verify.mockReturnValue(validPayload as any);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      configService.get
        .mockReturnValueOnce('7d')
        .mockReturnValueOnce('30d');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.token).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('无效 token 应该抛出异常', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token'))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken('invalid-token'))
        .rejects.toThrow('无效的刷新令牌');
    });

    it('用户不存在或已禁用应该抛出异常', async () => {
      jwtService.verify.mockReturnValue(validPayload as any);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('禁用用户应该抛出异常', async () => {
      jwtService.verify.mockReturnValue(validPayload as any);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, status: 'DISABLED' } as any);

      await expect(service.refreshToken('valid-refresh-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
