import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../system/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    console.log('=== AuthService Login ===');
    console.log('Username:', username);
    console.log('Password:', password);

    try {
      // 查找用户
      const user = await this.userRepository.findOne({
        where: { username },
        relations: ['roles'],
      });

      console.log('User query result:', user ? 'found' : 'not found');
      if (user) {
        console.log('User ID:', user.id);
        console.log('User status:', user.status);
        console.log('User roles:', user.roles);
      }

      if (!user) {
        console.error('User not found');
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 验证密码
      console.log('Comparing passwords...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.error('Invalid password');
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        console.error('User not active:', user.status);
        throw new UnauthorizedException('用户已被禁用');
      }

      // 生成JWT token
      const payload = {
        sub: user.id,
        username: user.username,
        roles: user.roles?.map((role) => role.roleCode) || [],
      };

      console.log('JWT payload:', payload);

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

      // 更新最后登录时间
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });

      const result = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          email: user.email,
          roles: user.roles?.map((role) => ({
            id: role.id,
            code: role.roleCode,
            name: role.roleName,
          })) || [],
        },
      };

      console.log('Login successful, returning result');
      return result;
    } catch (error) {
      console.error('AuthService login error:', error);
      throw error;
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['roles'],
      });

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      const newPayload = {
        sub: user.id,
        username: user.username,
        roles: user.roles.map((role) => role.roleCode),
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  /**
   * Passport LocalStrategy 使用：校验用户名密码
   */
  async validateLocalUser(username: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户已被禁用');
    }

    return user;
  }

  /**
   * JWT使用：按用户ID获取并校验状态
   */
  async validateUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('用户未授权');
    }
    return user;
  }

  /**
   * 登出
   */
  async logout(userId: string): Promise<void> {
    // 可以在这里处理token黑名单逻辑
    // 目前简单返回成功
    return;
  }
}
