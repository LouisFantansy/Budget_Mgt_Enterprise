import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  /**
   * 创建通知
   */
  async createNotification(data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        content: data.content,
        link: data.link,
        channels: data.channels || ['in_app'],
      },
    });
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
   */
  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
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
