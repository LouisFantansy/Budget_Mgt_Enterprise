import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户装饰器
 * 从 JWT request.user 中提取当前用户信息
 * 
 * 使用示例:
 * - @CurrentUser() user: CurrentUserType
 * - @CurrentUser('userId') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // 如果指定了字段名，返回特定字段
    if (data) {
      return user[data];
    }

    // 否则返回整个用户对象
    return user;
  },
);

/**
 * 当前用户类型定义
 */
export interface CurrentUserType {
  userId: string;
  username: string;
  departmentId: string;
  roles: string[];
}
