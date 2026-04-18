import uuid
from datetime import datetime

from rest_framework.response import Response


def generate_no(prefix='', separator=''):
    """
    生成业务编号
    格式: {prefix}{separator}{YYYYMMDD}{separator}{UUID短码}
    示例: BG-20260418-a3f1, PU-20260418-b7c2

    Args:
        prefix: 编号前缀 (如 BG=预算, PU=采购, AP=审批)
        separator: 分隔符 (默认无分隔符)

    Returns:
        str: 生成的业务编号
    """
    date_str = datetime.now().strftime('%Y%m%d')
    short_uuid = uuid.uuid4().hex[:4].upper()
    parts = [p for p in [prefix, date_str, short_uuid] if p]
    return separator.join(parts)


def generate_budget_no(year):
    """生成预算编号 BG-{year}-{seq:03d}"""
    from apps.budget.models import Budget
    last = Budget.objects.filter(year=year).order_by('-budget_no').first()
    if last:
        seq = int(last.budget_no.split('-')[-1]) + 1
    else:
        seq = 1
    return f'BG-{year}-{seq:03d}'


def generate_adjust_no(year):
    """生成调整编号 ADJ-{year}-{seq:03d}"""
    from apps.budget.models import BudgetAdjustment
    last = BudgetAdjustment.objects.filter(
        adjust_no__startswith=f'ADJ-{year}-'
    ).order_by('-adjust_no').first()
    if last:
        seq = int(last.adjust_no.split('-')[-1]) + 1
    else:
        seq = 1
    return f'ADJ-{year}-{seq:03d}'


def generate_purchase_no(year):
    """生成采购编号 PR-{year}-{seq:03d}"""
    from apps.purchase.models import PurchaseRequest
    last = PurchaseRequest.objects.filter(
        request_no__startswith=f'PR-{year}-'
    ).order_by('-request_no').first()
    if last:
        seq = int(last.request_no.split('-')[-1]) + 1
    else:
        seq = 1
    return f'PR-{year}-{seq:03d}'


def success_response(data=None, message='success'):
    return Response({
        'code': 200,
        'message': message,
        'data': data,
        'timestamp': datetime.now().isoformat(),
    })


def error_response(message='error', code=400, status_code=400):
    return Response({
        'code': code,
        'message': message,
        'data': None,
        'timestamp': datetime.now().isoformat(),
    }, status=status_code)


def get_client_ip(request):
    """获取客户端 IP 地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')
