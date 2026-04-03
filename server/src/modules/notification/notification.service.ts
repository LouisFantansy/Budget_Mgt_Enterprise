import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { EmailChannel } from './channels/email.channel';

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  channels?: string[];
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private emailChannel: EmailChannel,
  ) {}

  /**
   * 创建通知
   * 自动通过 WebSocket 推送，如果 channels 包含 email 则同时发送邮件
   */
  async createNotification(data: CreateNotificationDto) {
    // 1. 保存到数据库
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        content: data.content,
        link: data.link,
        channels: data.channels || ['in_app'],
      },
    });

    // 2. WebSocket 实时推送
    this.notificationGateway.sendToUser(data.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      link: notification.link,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    // 3. 邮件通知（异步，不阻塞主流程）
    if (data.channels?.includes('email')) {
      this.sendEmailNotification(data).catch((error) => {
        this.logger.error('Failed to send email notification:', error);
      });
    }

    return notification;
  }

  /**
   * 发送邮件通知（异步）
   */
  private async sendEmailNotification(data: CreateNotificationDto) {
    try {
      // 获取用户邮箱
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true },
      });

      if (!user?.email) {
        this.logger.warn(`User ${data.userId} has no email, skipping email notification`);
        return;
      }

      await this.emailChannel.sendNotificationEmail(
        user.email,
        data.title,
        data.content,
        data.link,
      );
    } catch (error) {
      this.logger.error('Error sending email notification:', error);
    }
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(userId: string, params: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
  }) {
    const { page = 1, pageSize = 20, isRead } = params;

    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 标记通知为已读
   * 验证通知是否属于当前用户
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('无权操作此通知');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * 发送审批通知
   */
  async sendApprovalNotification(
    approverId: string,
    targetType: string,
    targetId: string,
    stepName: string,
  ) {
    const titleMap = {
      'BUDGET': '预算审批待办',
      'PURCHASE': '采购审批待办',
      'ADJUSTMENT': '调整审批待办',
    };

    return this.createNotification({
      userId: approverId,
      type: 'APPROVAL_PENDING',
      title: titleMap[targetType as keyof typeof titleMap] || '审批待办',
      content: `您有一个${stepName}需要处理`,
      link: `/approvals/${targetId}`,
    });
  }

  /**
   * 发送审批结果通知
   */
  async sendApprovalResultNotification(
    userId: string,
    targetType: string,
    targetId: string,
    action: string,
    comment?: string,
  ) {
    const statusText = action === 'APPROVE' ? '已批准' : '已拒绝';
    const titleMap = {
      'BUDGET': '预算审批结果',
      'PURCHASE': '采购审批结果',
      'ADJUSTMENT': '调整审批结果',
    };

    return this.createNotification({
      userId,
      type: 'APPROVAL_RESULT',
      title: titleMap[targetType as keyof typeof titleMap] || '审批结果',
      content: `您的申请已被${statusText}${comment ? `，意见：${comment}` : ''}`,
      link: `/${targetType.toLowerCase()}s/${targetId}`,
    });
  }

  /**
   * 发送预算预警通知
   */
  async sendBudgetWarningNotification(
    userId: string,
    budgetName: string,
    usageRate: number,
  ) {
    return this.createNotification({
      userId,
      type: 'BUDGET_WARNING',
      title: '预算使用预警',
      content: `预算"${budgetName}"的使用率已达到${(usageRate * 100).toFixed(1)}%`,
      link: `/budgets/detail`,
    });
  }
}
