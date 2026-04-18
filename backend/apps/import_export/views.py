import uuid
from datetime import datetime
from decimal import Decimal

from django.db.models import Q, Sum, Count
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill

from common.pagination import StandardPagination
from common.permissions import IsAdmin
from common.utils import success_response, error_response, get_client_ip

from apps.audit.models import AuditLog

from .models import PurchaseOrder, Settlement, DataMapping, MatchStatus, Attachment
from .serializers import (
    PurchaseOrderSerializer,
    SettlementSerializer,
    DataMappingSerializer,
    AttachmentSerializer,
)


class ImportViewSet(viewsets.ViewSet):
    """数据导入"""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='purchase-orders')
    def import_purchase_orders(self, request):
        """
        POST /api/import/purchase-orders/ - 导入采购订单 Excel

        请求: multipart/form-data
            - file: Excel 文件

        Excel 列: order_no, supplier, amount, order_date, status, budget_no
        """
        file = request.FILES.get('file')
        if not file:
            return error_response('请上传文件')

        if not file.name.endswith(('.xlsx', '.xls')):
            return error_response('仅支持 Excel 文件（.xlsx/.xls）')

        try:
            from openpyxl import load_workbook
            wb = load_workbook(file)
            ws = wb.active
        except Exception as e:
            return error_response(f'文件解析失败: {str(e)}')

        batch_id = str(uuid.uuid4())
        success_count = 0
        error_rows = []

        # 跳过表头，从第二行开始
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            try:
                if not row[0]:  # 空行跳过
                    continue

                order_no = str(row[0]).strip() if row[0] else ''
                supplier = str(row[1]).strip() if row[1] else ''
                amount = Decimal(str(row[2])) if row[2] else Decimal('0')
                order_date = row[3] if row[3] else datetime.now()
                order_status = str(row[4]).strip() if row[4] else 'PENDING'
                budget_no = str(row[5]).strip() if row[5] and str(row[5]).strip() != 'None' else None

                # 检查是否重复
                if PurchaseOrder.objects.filter(order_no=order_no).exists():
                    error_rows.append({'row': row_idx, 'error': f'订单号 {order_no} 已存在'})
                    continue

                PurchaseOrder.objects.create(
                    order_no=order_no,
                    supplier=supplier,
                    amount=amount,
                    order_date=order_date if isinstance(order_date, datetime) else datetime.now(),
                    status=order_status,
                    budget_no=budget_no,
                    import_batch_id=batch_id,
                )
                success_count += 1

            except Exception as e:
                error_rows.append({'row': row_idx, 'error': str(e)})

        # 记录审计日志
        AuditLog.objects.create(
            user_id=str(request.user.id),
            user_name=request.user.name or request.user.username,
            action='IMPORT',
            module='import_export',
            target_type='purchase_orders',
            new_value={
                'batch_id': batch_id,
                'success_count': success_count,
                'error_count': len(error_rows),
            },
            ip=get_client_ip(request),
        )

        return success_response({
            'batch_id': batch_id,
            'success_count': success_count,
            'error_count': len(error_rows),
            'errors': error_rows,
        })

    @action(detail=False, methods=['post'], url_path='settlements')
    def import_settlements(self, request):
        """
        POST /api/import/settlements/ - 导入结算单 Excel

        请求: multipart/form-data
            - file: Excel 文件

        Excel 列: settlement_no, invoice_no, amount, settle_date, supplier, budget_no
        """
        file = request.FILES.get('file')
        if not file:
            return error_response('请上传文件')

        if not file.name.endswith(('.xlsx', '.xls')):
            return error_response('仅支持 Excel 文件（.xlsx/.xls）')

        try:
            from openpyxl import load_workbook
            wb = load_workbook(file)
            ws = wb.active
        except Exception as e:
            return error_response(f'文件解析失败: {str(e)}')

        batch_id = str(uuid.uuid4())
        success_count = 0
        error_rows = []

        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            try:
                if not row[0]:
                    continue

                settlement_no = str(row[0]).strip() if row[0] else ''
                invoice_no = str(row[1]).strip() if row[1] and str(row[1]).strip() != 'None' else None
                amount = Decimal(str(row[2])) if row[2] else Decimal('0')
                settle_date = row[3] if row[3] else datetime.now()
                supplier = str(row[4]).strip() if row[4] else ''
                budget_no = str(row[5]).strip() if row[5] and str(row[5]).strip() != 'None' else None

                if Settlement.objects.filter(settlement_no=settlement_no).exists():
                    error_rows.append({'row': row_idx, 'error': f'结算单号 {settlement_no} 已存在'})
                    continue

                Settlement.objects.create(
                    settlement_no=settlement_no,
                    invoice_no=invoice_no,
                    amount=amount,
                    settle_date=settle_date if isinstance(settle_date, datetime) else datetime.now(),
                    supplier=supplier,
                    budget_no=budget_no,
                    import_batch_id=batch_id,
                )
                success_count += 1

            except Exception as e:
                error_rows.append({'row': row_idx, 'error': str(e)})

        # 记录审计日志
        AuditLog.objects.create(
            user_id=str(request.user.id),
            user_name=request.user.name or request.user.username,
            action='IMPORT',
            module='import_export',
            target_type='settlements',
            new_value={
                'batch_id': batch_id,
                'success_count': success_count,
                'error_count': len(error_rows),
            },
            ip=get_client_ip(request),
        )

        return success_response({
            'batch_id': batch_id,
            'success_count': success_count,
            'error_count': len(error_rows),
            'errors': error_rows,
        })

    @action(detail=False, methods=['get'], url_path='templates/(?P<type>[^/.]+)')
    def download_template(self, request, type=None):
        """
        GET /api/import/templates/{type}/ - 下载导入模板

        type: purchase-orders, settlements, budgets
        """
        wb = Workbook()
        ws = wb.active

        header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
        header_font = Font(bold=True, color='FFFFFF')

        if type == 'purchase-orders':
            ws.title = "采购订单导入模板"
            headers = ['order_no', 'supplier', 'amount', 'order_date', 'status', 'budget_no']
            filename = 'purchase_orders_template.xlsx'

        elif type == 'settlements':
            ws.title = "结算单导入模板"
            headers = ['settlement_no', 'invoice_no', 'amount', 'settle_date', 'supplier', 'budget_no']
            filename = 'settlements_template.xlsx'

        elif type == 'budgets':
            ws.title = "预算导入模板"
            headers = ['budget_no', 'name', 'department_code', 'type', 'year', 'total_amount', 'remark']
            filename = 'budgets_template.xlsx'

        else:
            return error_response(f'不支持的模板类型: {type}')

        # 添加表头
        ws.append(headers)
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center', vertical='center')

        # 添加示例数据行
        if type == 'purchase-orders':
            ws.append(['PO-2026-001', '示例供应商', 100000, '2026-01-15', 'PENDING', 'BG-2026-001'])
        elif type == 'settlements':
            ws.append(['ST-2026-001', 'INV-001', 100000, '2026-02-15', '示例供应商', 'BG-2026-001'])
        elif type == 'budgets':
            ws.append(['BG-2026-001', '示例预算', 'DEPT001', 'OPEX', 2026, 1000000, '备注'])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response


class MappingViewSet(viewsets.ModelViewSet):
    """三单匹配"""

    queryset = DataMapping.objects.all()
    serializer_class = DataMappingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # matchStatus 筛选
        match_status = params.get('matchStatus')
        if match_status:
            qs = qs.filter(match_status=match_status)

        # budgetNo 筛选
        budget_no = params.get('budgetNo')
        if budget_no:
            qs = qs.filter(budget_no=budget_no)

        return qs

    @action(detail=False, methods=['post'], url_path='auto-match')
    def auto_match(self, request):
        """
        POST /api/mappings/auto-match/ - 自动匹配

        按 budget_no 匹配 PurchaseOrder 和 Settlement，
        创建/更新 DataMapping 记录，计算 amount_diff
        """
        matched_count = 0
        created_count = 0

        # 获取所有有 budget_no 的采购订单
        purchase_orders = PurchaseOrder.objects.filter(
            budget_no__isnull=False
        ).exclude(budget_no='')

        for po in purchase_orders:
            # 查找同 budget_no 的结算单
            settlements = Settlement.objects.filter(budget_no=po.budget_no)

            for settlement in settlements:
                # 检查是否已存在匹配记录
                existing = DataMapping.objects.filter(
                    budget_no=po.budget_no,
                    purchase_order_no=po.order_no,
                    settlement_no=settlement.settlement_no,
                ).first()

                # 计算 amount_diff
                amount_diff = po.amount - settlement.amount

                # 判断匹配状态
                if amount_diff == 0:
                    match_status = MatchStatus.FULL
                elif abs(amount_diff) < po.amount * Decimal('0.05'):
                    match_status = MatchStatus.PARTIAL
                else:
                    match_status = MatchStatus.NONE

                if existing:
                    # 更新已有记录
                    existing.match_status = match_status
                    existing.amount_diff = amount_diff
                    existing.save(update_fields=['match_status', 'amount_diff'])
                    matched_count += 1
                else:
                    # 创建新记录
                    DataMapping.objects.create(
                        budget_no=po.budget_no,
                        purchase_order_no=po.order_no,
                        settlement_no=settlement.settlement_no,
                        match_status=match_status,
                        amount_diff=amount_diff,
                    )
                    created_count += 1

        # 记录审计日志
        AuditLog.objects.create(
            user_id=str(request.user.id),
            user_name=request.user.name or request.user.username,
            action='UPDATE',
            module='import_export',
            target_type='data_mapping',
            new_value={
                'action': 'auto_match',
                'matched_count': matched_count,
                'created_count': created_count,
            },
            ip=get_client_ip(request),
        )

        return success_response({
            'matched_count': matched_count,
            'created_count': created_count,
            'total': matched_count + created_count,
        })


class ExportViewSet(viewsets.ViewSet):
    """数据导出"""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='budgets')
    def export_budgets(self, request):
        """
        GET /api/export/budgets/ - 导出预算数据 Excel

        查询参数:
            - year: 年度
            - departmentId: 部门ID
            - status: 状态
        """
        from apps.budget.models import Budget

        qs = Budget.objects.all()
        params = request.query_params

        if params.get('year'):
            qs = qs.filter(year=params['year'])
        if params.get('departmentId'):
            qs = qs.filter(department_id=params['departmentId'])
        if params.get('status'):
            qs = qs.filter(status=params['status'])

        wb = Workbook()
        ws = wb.active
        ws.title = "预算数据"

        headers = ['预算编号', '名称', '部门', '类型', '年度', '总额', '已使用', '冻结', '状态', '创建时间']
        ws.append(headers)

        header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
        header_font = Font(bold=True, color='FFFFFF')
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center', vertical='center')

        for budget in qs:
            ws.append([
                budget.budget_no,
                budget.name,
                budget.department.name if budget.department else '',
                budget.get_type_display(),
                budget.year,
                float(budget.total_amount or 0),
                float(budget.used_amount or 0),
                float(budget.frozen_amount or 0),
                budget.get_status_display(),
                budget.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])

        for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
            ws.column_dimensions[col].width = 15
        ws.column_dimensions['B'].width = 25

        # 审计日志
        AuditLog.objects.create(
            user_id=str(request.user.id),
            user_name=request.user.name or request.user.username,
            action='EXPORT',
            module='import_export',
            target_type='budgets',
            new_value={'filters': dict(params)},
            ip=get_client_ip(request),
        )

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="budgets.xlsx"'
        wb.save(response)
        return response

    @action(detail=False, methods=['get'], url_path='analysis')
    def export_analysis(self, request):
        """
        GET /api/export/analysis/ - 导出分析数据 Excel

        查询参数:
            - year: 年度（默认当前年）
        """
        from apps.budget.models import Budget, BudgetItem
        from apps.department.models import Department

        year = int(request.query_params.get('year', datetime.now().year))

        wb = Workbook()

        # 预算使用概况
        ws1 = wb.active
        ws1.title = "预算使用概况"

        budgets = Budget.objects.filter(year=year).select_related('department')
        headers = ['预算编号', '名称', '部门', '类型', '总额', '已使用', '冻结', '可用', '使用率(%)', '状态']
        ws1.append(headers)

        header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
        header_font = Font(bold=True, color='FFFFFF')
        for cell in ws1[1]:
            cell.fill = header_fill
            cell.font = header_font

        for budget in budgets:
            total = budget.total_amount or Decimal('0')
            used = budget.used_amount or Decimal('0')
            frozen = budget.frozen_amount or Decimal('0')
            available = total - used - frozen
            usage_rate = (used / total * 100) if total > 0 else 0

            ws1.append([
                budget.budget_no,
                budget.name,
                budget.department.name if budget.department else '',
                budget.get_type_display(),
                float(total),
                float(used),
                float(frozen),
                float(available),
                round(usage_rate, 2),
                budget.get_status_display(),
            ])

        # 部门汇总
        ws2 = wb.create_sheet("部门汇总")

        ws2.append(['部门', '预算总额', '已使用', '使用率(%)'])
        for cell in ws2[1]:
            cell.fill = header_fill
            cell.font = header_font

        for dept in Department.objects.all():
            dept_budgets = budgets.filter(department=dept)
            total = dept_budgets.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            used = dept_budgets.aggregate(used=Sum('used_amount'))['used'] or Decimal('0')
            usage_rate = (used / total * 100) if total > 0 else 0

            if total > 0:
                ws2.append([
                    dept.name,
                    float(total),
                    float(used),
                    round(usage_rate, 2),
                ])

        # 类别分析
        ws3 = wb.create_sheet("类别分析")
        category_stats = BudgetItem.objects.filter(
            budget__year=year
        ).values('category').annotate(
            total_amount=Sum('total_amount'),
            used_amount=Sum('used_amount'),
            item_count=Count('id')
        ).order_by('-total_amount')

        ws3.append(['类别', '总额', '已使用', '项目数', '使用率(%)'])
        for cell in ws3[1]:
            cell.fill = header_fill
            cell.font = header_font

        for stat in category_stats:
            total = stat['total_amount'] or Decimal('0')
            used = stat['used_amount'] or Decimal('0')
            usage_rate = (used / total * 100) if total > 0 else 0
            ws3.append([
                stat['category'],
                float(total),
                float(used),
                stat['item_count'],
                round(usage_rate, 2),
            ])

        # 审计日志
        AuditLog.objects.create(
            user_id=str(request.user.id),
            user_name=request.user.name or request.user.username,
            action='EXPORT',
            module='import_export',
            target_type='analysis',
            ip=get_client_ip(request),
        )

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="analysis.xlsx"'
        wb.save(response)
        return response