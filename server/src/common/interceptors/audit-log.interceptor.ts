import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from 'src/common/prisma/prisma.service';

// 存储原始值的上下文键
export const AUDIT_CONTEXT_KEY = '__audit_context__';

export interface AuditContext {
  oldValue?: any;
  newValue?: any;
  action?: string;
  module?: string;
  targetType?: string;
  targetId?: string;
  description?: string;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const user = request.user;

    const startTime = Date.now();
    
    // 保存请求体作为 oldValue 的参考（用于 UPDATE 操作）
    const requestBody = body ? JSON.parse(JSON.stringify(body)) : undefined;

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        // 获取审计上下文（如果有）
        const auditContext: AuditContext = request[AUDIT_CONTEXT_KEY] || {};
        
        // 确定操作类型
        const action = auditContext.action || this.mapMethodToAction(method);
        
        // 提取模块和目标信息
        const module = auditContext.module || this.extractModule(url);
        const targetType = auditContext.targetType || this.extractTargetType(url);
        const targetId = auditContext.targetId || this.extractTargetId(url);
        
        // 构建 oldValue 和 newValue
        let oldValue = auditContext.oldValue;
        let newValue = auditContext.newValue;
        
        // 如果没有显式设置，尝试从请求/响应推断
        if (oldValue === undefined && newValue === undefined) {
          if (action === 'UPDATE' || action === 'APPROVE' || action === 'REJECT') {
            // UPDATE 操作：请求体可能包含新值
            oldValue = requestBody;
            newValue = response?.data || response;
          } else if (action === 'CREATE') {
            // CREATE 操作：响应通常包含创建的对象
            newValue = response?.data || response;
          } else if (action === 'DELETE') {
            // DELETE 操作：可能需要在请求中设置 oldValue
            oldValue = requestBody;
          }
        }

        // 清理敏感字段
        oldValue = this.sanitizeSensitiveData(oldValue);
        newValue = this.sanitizeSensitiveData(newValue);

        // 获取用户真实IP
        const ip = this.getClientIp(request);
        const userAgent = request.headers['user-agent'];

        // 记录审计日志
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user?.userId || user?.id || 'anonymous',
              userName: user?.username || user?.name || 'Anonymous',
              action,
              module,
              targetType,
              targetId,
              oldValue: oldValue || null,
              newValue: newValue || null,
              ip,
              userAgent,
            },
          });
        } catch (error) {
          // 审计日志记录失败不应影响主业务流程
          console.error('Failed to create audit log:', error);
        }
      }),
    );
  }

  private mapMethodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      'GET': 'READ',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
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
    // 查找 UUID 格式的 ID
    for (const part of parts) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
        return part;
      }
    }
    // 或者返回 URL 的最后一部分（如果不是 api）
    if (parts.length >= 3 && parts[0] === 'api') {
      const lastPart = parts[parts.length - 1];
      // 排除常见的非ID路径
      const nonIdPaths = ['list', 'search', 'export', 'import', 'stats', 'count'];
      if (!nonIdPaths.includes(lastPart.toLowerCase())) {
        return lastPart;
      }
    }
    return null;
  }

  private getClientIp(request: any): string | null {
    // 尝试从各种 header 获取真实 IP
    const forwarded = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const cfConnectingIp = request.headers['cf-connecting-ip'];
    
    if (forwarded) {
      // X-Forwarded-For 可能包含多个 IP，取第一个
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    return request.ip || null;
  }

  private sanitizeSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn', 'idCard'];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
      }
    }

    return sanitized;
  }
}

/**
 * 装饰器：设置审计上下文
 * 可以在 Controller 方法上使用此装饰器来提供额外的审计信息
 */
export function AuditContext(context: AuditContext) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args.find(arg => arg && typeof arg === 'object' && 'headers' in arg);
      if (request) {
        request[AUDIT_CONTEXT_KEY] = {
          ...request[AUDIT_CONTEXT_KEY],
          ...context,
        };
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
