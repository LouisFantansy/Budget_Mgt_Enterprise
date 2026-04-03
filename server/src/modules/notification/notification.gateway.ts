import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/ws/notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);
      this.logger.log(`User ${userId} connected, socket: ${client.id}`);
    } else {
      this.logger.warn(`Socket ${client.id} connected without userId`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, sockets);
        }
      }
      this.logger.log(`User ${userId} disconnected, socket: ${client.id}`);
    } else {
      // 尝试从所有用户的 socket 列表中清理
      for (const [uid, socketIds] of this.userSockets.entries()) {
        const index = socketIds.indexOf(client.id);
        if (index > -1) {
          socketIds.splice(index, 1);
          if (socketIds.length === 0) {
            this.userSockets.delete(uid);
          }
          this.logger.log(
            `Cleaned up socket ${client.id} for user ${uid}`,
          );
          break;
        }
      }
    }
  }

  /**
   * 向特定用户推送通知
   */
  sendToUser(userId: string, notification: any) {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.length === 0) {
      this.logger.debug(`User ${userId} is not online, skipping push`);
      return;
    }

    socketIds.forEach((sid) => {
      this.server.to(sid).emit('notification', notification);
    });
    this.logger.log(`Pushed notification to user ${userId}`);
  }

  /**
   * 向所有在线用户广播通知
   */
  broadcast(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log('Broadcasted notification to all users');
  }

  /**
   * 获取在线用户数量
   */
  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.length > 0;
  }
}
