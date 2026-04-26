import traceback
from datetime import datetime

from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    统一异常处理器
    所有响应格式统一为 {code, message, data, timestamp}
    """
    # 调用 DRF 默认异常处理器
    response = exception_handler(exc, context)

    if response is not None:
        # DRF 能识别的异常
        message = ''
        data = None

        if isinstance(response.data, dict):
            # 处理字段验证错误
            if 'detail' in response.data:
                message = str(response.data['detail'])
            else:
                # 字段级错误，合并为一条消息
                errors = []
                for field, messages in response.data.items():
                    if isinstance(messages, list):
                        errors.append(f'{field}: {" ".join(str(m) for m in messages)}')
                    else:
                        errors.append(f'{field}: {messages}')
                message = '; '.join(errors)
                data = response.data
        elif isinstance(response.data, list):
            message = '; '.join(str(item) for item in response.data)
        else:
            message = str(response.data)

        response.data = {
            'code': response.status_code,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat(),
        }
    else:
        # DRF 无法识别的异常（如 Django 异常）
        if settings.DEBUG:
            import traceback
            traceback.print_exc()
        response = Response(
            data={
                'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'message': '服务器内部错误',
                'data': None,
                'timestamp': datetime.now().isoformat(),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
