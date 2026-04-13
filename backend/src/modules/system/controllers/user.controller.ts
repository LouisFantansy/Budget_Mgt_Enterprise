import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('system')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ========== 用户管理 ==========
  @Get('users')
  async findAllUsers(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return await this.userService.findAll({ keyword, status, page, pageSize });
  }

  @Get('users/:id')
  async findOneUser(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Post('users')
  async createUser(
    @Body()
    body: {
      username: string;
      password: string;
      realName: string;
      email?: string;
      phone?: string;
      departmentId?: string;
      roleCodes?: string[];
    },
  ) {
    return await this.userService.create(body);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      realName?: string;
      email?: string;
      phone?: string;
      departmentId?: string;
      status?: string;
      roleCodes?: string[];
    },
  ) {
    return await this.userService.update(id, body);
  }

  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    await this.userService.resetPassword(id, password);
    return { message: '密码重置成功' };
  }

  @Delete('users/:id')
  async removeUser(@Param('id') id: string) {
    await this.userService.remove(id);
    return { message: '删除成功' };
  }

  // ========== 角色管理 ==========
  @Get('roles')
  async findAllRoles() {
    return await this.userService.findAllRoles();
  }
}
