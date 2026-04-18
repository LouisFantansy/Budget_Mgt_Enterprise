from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """统一分页器"""
    page_size = 20
    page_size_query_param = 'pageSize'
    max_page_size = 100
    page_query_param = 'page'

    def get_paginated_response(self, data):
        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'items': data,
                'total': self.page.paginator.count,
                'page': self.page.number,
                'pageSize': self.get_page_size(self.request),
                'totalPages': self.page.paginator.num_pages,
            },
        })

    def get_paginated_response_schema(self, schema):
        return {
            'type': 'object',
            'properties': {
                'code': {'type': 'integer', 'example': 200},
                'message': {'type': 'string', 'example': 'success'},
                'data': {
                    'type': 'object',
                    'properties': {
                        'items': schema,
                        'total': {'type': 'integer', 'example': 100},
                        'page': {'type': 'integer', 'example': 1},
                        'pageSize': {'type': 'integer', 'example': 20},
                        'totalPages': {'type': 'integer', 'example': 5},
                    },
                },
            },
        }
