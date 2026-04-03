import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 验证用户登录
   */
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
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

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // 返回不含密码的用户信息
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 登录并生成 Token
   */
  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user.id,
      departmentId: user.departmentId,
      roles: user.roles.map(r => r.role.name),
    };

    return {
      token: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('jwt.expiresIn', '7d'),
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('jwt.refreshExpiresIn', '30d'),
      }),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        roles: user.roles.map(r => r.role.name),
        permissions: user.roles.flatMap(r => 
          r.role.permissions.map(p => p.permission.name)
        ),
      },
    };
  }

  /**
   * 注册新用户
   */
  async register(registerDto: any) {
    const { username, password, name, email, phone, departmentId } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（默认分配普通用户角色）
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        phone,
        departmentId: departmentId || '',
        roles: {
          create: {
            roleId: await this.getDefaultRoleId(), // 获取默认角色 ID
          },
        },
      },
      include: {
        department: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('旧密码错误');
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: '密码修改成功' };
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
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

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('用户不存在或已禁用');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  /**
   * 获取默认角色 ID（普通用户）
   */
  private async getDefaultRoleId(): Promise<string> {
    const role = await this.prisma.role.findFirst({
      where: { name: 'viewer' },
    });

    if (!role) {
      // 如果不存在，创建一个默认角色
      const newRole = await this.prisma.role.create({
        data: {
          name: 'viewer',
          displayName: '普通用户',
          description: '查看权限',
        },
      });
      return newRole.id;
    }

    return role.id;
  }
}
