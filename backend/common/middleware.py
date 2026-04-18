import json
import time
import logging

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('audit')


class AuditLogMiddleware(MiddlewareMixin):
    """
    审计日志中间件 - 预留
    记录请求方法、路径、用户、时间等信息
    """

    def process_request(self, request):
        request._audit_start_time = time.time()

    def process_response(self, request, response):
        # 只记录 API 请求
        if not request.path.startswith('/api/'):
            return response

        user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
        duration = time.time() - getattr(request, '_audit_start_time', time.time())

        log_data = {
            'method': request.method,
            'path': request.path,
            'user_id': str(user.id) if user else None,
            'username': user.username if user else None,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
        }

        if response.status_code >= 400:
            logger.warning(f"API Request: {json.dumps(log_data)}")
        else:
            logger.info(f"API Request: {json.dumps(log_data)}")

        return response
