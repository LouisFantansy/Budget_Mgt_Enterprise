from datetime import datetime

from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    """
    自定义 JSON 渲染器，统一响应格式：
    {
        "code": 200,
        "message": "success",
        "data": {...},
        "timestamp": "2026-04-17T22:00:00"
    }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response = renderer_context.get('response')

        # 如果已经是统一格式（异常处理器已处理 / 分页器已处理），直接渲染
        if isinstance(data, dict) and 'code' in data and 'timestamp' in data:
            return super().render(data, accepted_media_type, renderer_context)

        # 构建统一响应
        if response and response.status_code >= 400:
            # 错误响应
            code = response.status_code
            message = 'error'
            if isinstance(data, dict) and 'detail' in data:
                message = data['detail']
            elif isinstance(data, str):
                message = data
        else:
            # 成功响应
            code = response.status_code if response else 200
            message = 'success'

        result = {
            'code': code,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat(),
        }

        return super().render(result, accepted_media_type, renderer_context)
