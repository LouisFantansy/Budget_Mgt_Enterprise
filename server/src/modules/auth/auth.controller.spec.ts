import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            validateUser: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('应该返回 token 和用户信息', async () => {
      const loginDto = { username: 'test', password: 'password' };
      const mockUser = {
        id: '1',
        username: 'test',
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        roles: [],
        department: null,
      };
      const result = { 
        token: 'jwt-token', 
        refreshToken: 'refresh-token',
        user: { id: '1', username: 'test', name: 'Test User', email: 'test@example.com', avatar: null, roles: [], permissions: [] } 
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);
      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(await controller.login(loginDto)).toEqual(result);
    });
  });
});
