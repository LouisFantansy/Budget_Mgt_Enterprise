import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const user = request.user;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        // 记录审计日志
        await this.prisma.auditLog.create({
          data: {
            userId: user?.userId || 'anonymous',
            userName: user?.username || 'Anonymous',
            action: this.mapMethodToAction(method),
            module: this.extractModule(url),
            targetType: this.extractTargetType(url),
            targetId: this.extractTargetId(url),
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          },
        });
      }),
    );
  }

  private mapMethodToAction(method: string): string {
    const actionMap: any = {
      'GET': 'READ',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'DELETE': 'DELETE',
    };
    return actionMap[method] || method;
  }

  private extractModule(url: string): string {
    const parts = url.split('/').filter(Boolean);
    if (parts.length > 1 && parts[0] === 'api') {
      return parts[1];
    }
    return 'unknown';
  }

  private extractTargetType(url: string): string | null {
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].toUpperCase();
    }
    return null;
  }

  private extractTargetId(url: string): string | null {
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 3) {
      return parts[2];
    }
    return null;
  }
}
