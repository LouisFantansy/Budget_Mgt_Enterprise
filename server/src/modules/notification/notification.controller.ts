import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 获取通知列表（分页）
   * GET /api/notifications?page=1&pageSize=20&isRead=false
   */
  @Get()
  async getNotifications(
    @Request() req,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('isRead') isRead?: string,
  ) {
    const userId = req.user.userId;
    const params: any = {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    };

    if (isRead !== undefined) {
      params.isRead = isRead === 'true';
    }

    return this.notificationService.getUserNotifications(userId, params);
  }

  /**
   * 标记通知为已读
   * PUT /api/notifications/:id/read
   */
  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.notificationService.markAsRead(id, userId);
  }

  /**
   * 标记所有通知为已读
   * PUT /api/notifications/read-all
   */
  @Put('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    return this.notificationService.markAllAsRead(userId);
  }

  /**
   * 获取未读通知数量
   * GET /api/notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }
}
