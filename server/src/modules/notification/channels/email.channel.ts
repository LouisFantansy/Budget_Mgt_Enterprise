import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email configuration is incomplete. Email notifications will be skipped.',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * 发送邮件
   * @param to 收件人邮箱
   * @param subject 邮件主题
   * @param html 邮件内容（HTML格式）
   * @returns 是否发送成功
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.debug('Email transporter not available, skipping email');
      return false;
    }

    const from = this.configService.get<string>('MAIL_FROM');

    try {
      const info = await this.transporter.sendMail({
        from: from || 'noreply@example.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}, messageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * 发送通知邮件（包装方法）
   * @param to 收件人邮箱
   * @param title 通知标题
   * @param content 通知内容
   * @param link 可选的跳转链接
   * @returns 是否发送成功
   */
  async sendNotificationEmail(
    to: string,
    title: string,
    content: string,
    link?: string,
  ): Promise<boolean> {
    const html = this.buildEmailTemplate(title, content, link);
    return this.sendEmail(to, title, html);
  }

  /**
   * 构建邮件模板
   */
  private buildEmailTemplate(
    title: string,
    content: string,
    link?: string,
  ): string {
    const linkHtml = link
      ? `<p style="margin-top: 20px;">
           <a href="${link}" 
              style="background-color: #1890ff; color: white; padding: 10px 20px; 
                     text-decoration: none; border-radius: 4px; display: inline-block;">
             查看详情
           </a>
         </p>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">
            ${title}
          </h2>
          <div style="color: #666; line-height: 1.6; font-size: 14px;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          ${linkHtml}
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            此邮件由企业预算管理系统自动发送，请勿回复。
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 检查邮件服务是否可用
   */
  isAvailable(): boolean {
    return this.transporter !== null;
  }
}
