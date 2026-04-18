from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Sum, Count, Q, F
from django.http import HttpResponse
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill

from common.permissions import DataIsolationMixin
from common.utils import success_response, error_response, get_client_ip

from apps.budget.models import Budget, BudgetStatus
from apps.purchase.models import PurchaseRequest, PurchaseStatus
from apps.workflow.models import ApprovalFlow, ApprovalStatus
from apps.audit.models import AuditLog


class ReportViewSet(ViewSet):
    """报表分析"""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        GET /api/analysis/dashboard/ - 仪表盘数据

        返回:
            - budget_summary: 预算汇总（总额、已使用、冻结、可用）
            - pending_approvals: 待审批数量
            - monthly_new: 本月新增（预算数、采购数）
            - usage_rate: 预算使用率
        """
        user = request.user
        user_roles = set(user.roles.values_list('name', flat=True))

        # 基础查询集（根据权限过滤）
        budget_qs = Budget.objects.all()
        purchase_qs = PurchaseRequest.objects.all()

        # 非管理员进行数据隔离
        if not user_roles & {'admin', 'budget_manager', 'finance'}:
            if 'dept_head' in user_roles and user.department:
                dept_ids = [user.department_id] + list(
                    user.department.children.values_list('id', flat=True)
                )
                budget_qs = budget_qs.filter(department_id__in=dept_ids)
                purchase_qs = purchase_qs.filter(department_id__in=dept_ids)
            else:
                budget_qs = budget_qs.filter(department_id=user.department_id)
                purchase_qs = purchase_qs.filter(department_id=user.department_id)

        # 预算汇总
        budget_stats = budget_qs.aggregate(
            total_amount=Sum('total_amount') or Decimal('0'),
            used_amount=Sum('used_amount') or Decimal('0'),
            frozen_amount=Sum('frozen_amount') or Decimal('0'),
        )
        total_amount = budget_stats['total_amount'] or Decimal('0')
        used_amount = budget_stats['used_amount'] or Decimal('0')
        frozen_amount = budget_stats['frozen_amount'] or Decimal('0')
        available_amount = total_amount - used_amount - frozen_amount

        # 待审批数量
        pending_approvals = ApprovalFlow.objects.filter(
            status=ApprovalStatus.IN_PROGRESS
        ).count()

        # 本月新增
        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        monthly_new_budgets = budget_qs.filter(
            created_at__gte=current_month_start
        ).count()

        monthly_new_purchases = purchase_qs.filter(
            created_at__gte=current_month_start
        ).count()

        # 预算使用率
        usage_rate = (used_amount / total_amount * 100) if total_amount > 0 else 0

        return success_response({
            'budget_summary': {
                'total_amount': str(total_amount),
                'used_amount': str(used_amount),
                'frozen_amount': str(frozen_amount),
                'available_amount': str(available_amount),
            },
            'pending_approvals': pending_approvals,
            'monthly_new': {
                'budgets': monthly_new_budgets,
                'purchases': monthly_new_purchases,
            },
            'usage_rate': round(usage_rate, 2),
        })

    @action(detail=False, methods=['get'], url_path='department-ranking')
    def department_ranking(self, request):
        """
        GET /api/analysis/department-ranking/ - 部门排名

        查询参数:
            - year: 年度（默认当前年）
            - limit: 返回数量（默认10）
            - orderBy: 排序字段（total_amount/used_amount，默认total_amount）
        """
        year = int(request.query_params.get('year', datetime.now().year))
        limit = int(request.query_params.get('limit', 10))
        order_by = request.query_params.get('orderBy', 'total_amount')

        if order_by not in ['total_amount', 'used_amount']:
            order_by = 'total_amount'

        from apps.department.models import Department

        # 按部门聚合预算数据
        departments = Department.objects.filter(
            budgets__year=year
        ).annotate(
            total_amount=Sum('budgets__total_amount'),
            used_amount=Sum('budgets__used_amount'),
            budget_count=Count('budgets')
        ).order_by(f'-{order_by}')[:limit]

        result = []
        for dept in departments:
            usage_rate = (
                (dept.used_amount / dept.total_amount * 100)
                if dept.total_amount else 0
            )
            result.append({
                'department_id': str(dept.id),
                'department_name': dept.name,
                'total_amount': str(dept.total_amount or 0),
                'used_amount': str(dept.used_amount or 0),
                'budget_count': dept.budget_count,
                'usage_rate': round(usage_rate, 2),
            })

        return success_response(result)

    @action(detail=False, methods=['get'], url_path='monthly-trend')
    def monthly_trend(self, request):
        """
        GET /api/analysis/monthly-trend/ - 月度趋势

        查询参数:
            - year: 年度（默认当前年）
            - departmentId: 部门ID（可选）
        """
        year = int(request.query_params.get('year', datetime.now().year))
        department_id = request.query_params.get('departmentId')

        # 基础查询
        budget_qs = Budget.objects.filter(year=year)
        if department_id:
            budget_qs = budget_qs.filter(department_id=department_id)

        # 按月聚合
        monthly_data = []
        for month in range(1, 13):
            month_start = datetime(year, month, 1)
            if month == 12:
                month_end = datetime(year + 1, 1, 1)
            else:
                month_end = datetime(year, month + 1, 1)

            month_stats = budget_qs.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).aggregate(
                new_budgets=Count('id'),
                total_amount=Sum('total_amount') or Decimal('0'),
                used_amount=Sum('used_amount') or Decimal('0'),
            )

            monthly_data.append({
                'month': month,
                'month_name': f'{month}月',
                'new_budgets': month_stats['new_budgets'],
                'total_amount': str(month_stats['total_amount'] or 0),
                'used_amount': str(month_stats['used_amount'] or 0),
            })

        return success_response(monthly_data)

    @action(detail=False, methods=['get'], url_path='category-analysis')
    def category_analysis(self, request):
        """
        GET /api/analysis/category-analysis/ - 类别分析

        查询参数:
            - year: 年度（默认当前年）
            - departmentId: 部门ID（可选）
            - type: 预算类型（OPEX/CAPEX，可选）
        """
        year = int(request.query_params.get('year', datetime.now().year))
        department_id = request.query_params.get('departmentId')
        budget_type = request.query_params.get('type')

        # 基础查询
        from apps.budget.models import BudgetItem
        item_qs = BudgetItem.objects.filter(budget__year=year)

        if department_id:
            item_qs = item_qs.filter(budget__department_id=department_id)
        if budget_type:
            item_qs = item_qs.filter(budget__type=budget_type)

        # 按类别聚合
        category_stats = item_qs.values('category').annotate(
            total_amount=Sum('total_amount'),
            used_amount=Sum('used_amount'),
            item_count=Count('id')
        ).order_by('-total_amount')

        result = []
        for stat in category_stats:
            usage_rate = (
                (stat['used_amount'] / stat['total_amount'] * 100)
                if stat['total_amount'] else 0
            )
            result.append({
                'category': stat['category'],
                'total_amount': str(stat['total_amount'] or 0),
                'used_amount': str(stat['used_amount'] or 0),
                'item_count': stat['item_count'],
                'usage_rate': round(usage_rate, 2),
            })

        return success_response(result)

    @action(detail=False, methods=['get'], url_path='budget-summary')
    def budget_summary(self, request):
        """
        GET /api/analysis/budget-summary/ - 预算汇总

        按部门和类型汇总
        """
        year = int(request.query_params.get('year', datetime.now().year))

        from apps.department.models import Department

        # 按部门和类型汇总
        departments = Department.objects.filter(
            budgets__year=year
        ).prefetch_related('budgets')

        result = []
        for dept in departments:
            opex_amount = sum(
                b.total_amount for b in dept.budgets.all() if b.type == 'OPEX'
            )
            capex_amount = sum(
                b.total_amount for b in dept.budgets.all() if b.type == 'CAPEX'
            )

            result.append({
                'department_id': str(dept.id),
                'department_name': dept.name,
                'opex_amount': str(opex_amount),
                'capex_amount': str(capex_amount),
                'total_amount': str(opex_amount + capex_amount),
            })

        return success_response(result)

    @action(detail=False, methods=['get'], url_path='budget-usage')
    def budget_usage(self, request):
        """
        GET /api/analysis/budget-usage/ - 预算使用追踪列表

        返回所有 APPROVED 预算的使用率排序
        """
        user = request.user
        user_roles = set(user.roles.values_list('name', flat=True))

        # 基础查询
        budget_qs = Budget.objects.filter(status=BudgetStatus.APPROVED)

        # 非管理员进行数据隔离
        if not user_roles & {'admin', 'budget_manager', 'finance'}:
            if 'dept_head' in user_roles and user.department:
                dept_ids = [user.department_id] + list(
                    user.department.children.values_list('id', flat=True)
                )
                budget_qs = budget_qs.filter(department_id__in=dept_ids)
            else:
                budget_qs = budget_qs.filter(department_id=user.department_id)

        # 计算使用率并排序
        budgets = list(budget_qs)
        result = []

        for budget in budgets:
            total = budget.total_amount or Decimal('0')
            used = budget.used_amount or Decimal('0')
            frozen = budget.frozen_amount or Decimal('0')
            available = total - used - frozen

            usage_rate = (used / total * 100) if total > 0 else 0

            result.append({
                'budget_id': str(budget.id),
                'budget_no': budget.budget_no,
                'name': budget.name,
                'department_name': budget.department.name if budget.department else '',
                'year': budget.year,
                'total_amount': str(total),
                'used_amount': str(used),
                'frozen_amount': str(frozen),
                'available_amount': str(available),
                'usage_rate': round(usage_rate, 2),
            })

        # 按使用率降序排序
        result.sort(key=lambda x: x['usage_rate'], reverse=True)

        return success_response(result)

    @action(detail=False, methods=['get'], url_path='export/budgets')
    def export_budgets(self, request):
        """
        GET /api/analysis/export/budgets/ - 导出预算报表 Excel
        """
        user = request.user
        user_roles = set(user.roles.values_list('name', flat=True))

        # 基础查询
        budget_qs = Budget.objects.all()

        # 非管理员进行数据隔离
        if not user_roles & {'admin', 'budget_manager', 'finance'}:
            if 'dept_head' in user_roles and user.department:
                dept_ids = [user.department_id] + list(
                    user.department.children.values_list('id', flat=True)
                )
                budget_qs = budget_qs.filter(department_id__in=dept_ids)
            else:
                budget_qs = budget_qs.filter(department_id=user.department_id)

        # 创建 Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "预算报表"

        # 表头
        headers = ['预算编号', '预算名称', '部门', '类型', '年度', '总额', '已使用', '冻结', '可用', '使用率(%)', '状态']
        ws.append(headers)

        # 表头样式
        header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
        header_font = Font(bold=True, color='FFFFFF')
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center', vertical='center')

        # 数据
        for budget in budget_qs:
            total = budget.total_amount or Decimal('0')
            used = budget.used_amount or Decimal('0')
            frozen = budget.frozen_amount or Decimal('0')
            available = total - used - frozen
            usage_rate = (used / total * 100) if total > 0 else 0

            ws.append([
                budget.budget_no,
                budget.name,
                budget.department.name if budget.department else '',
                budget.get_type_display(),
                budget.year,
                float(total),
                float(used),
                float(frozen),
                float(available),
                round(usage_rate, 2),
                budget.get_status_display(),
            ])

        # 调整列宽
        for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']:
            ws.column_dimensions[col].width = 15
        ws.column_dimensions['B'].width = 25

        # 记录审计日志
        AuditLog.objects.create(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='EXPORT',
            module='report',
            target_type='budget_report',
            ip=get_client_ip(request),
        )

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="budget_report.xlsx"'
        wb.save(response)
        return response

    @action(detail=False, methods=['get'], url_path='export/analysis')
    def export_analysis(self, request):
        """
        GET /api/analysis/export/analysis/ - 导出分析报表 Excel
        """
        user = request.user

        # 创建 Excel
        wb = Workbook()

        # 部门排名表
        ws1 = wb.active
        ws1.title = "部门排名"

        from apps.department.models import Department
        year = datetime.now().year

        departments = Department.objects.filter(
            budgets__year=year
        ).annotate(
            total_amount=Sum('budgets__total_amount'),
            used_amount=Sum('budgets__used_amount'),
            budget_count=Count('budgets')
        ).order_by('-total_amount')[:20]

        ws1.append(['部门', '预算总额', '已使用', '预算数', '使用率(%)'])
        for dept in departments:
            total = dept.total_amount or Decimal('0')
            used = dept.used_amount or Decimal('0')
            usage_rate = (used / total * 100) if total > 0 else 0
            ws1.append([
                dept.name,
                float(total),
                float(used),
                dept.budget_count,
                round(usage_rate, 2),
            ])

        # 类别分析表
        ws2 = wb.create_sheet("类别分析")
        from apps.budget.models import BudgetItem

        category_stats = BudgetItem.objects.filter(
            budget__year=year
        ).values('category').annotate(
            total_amount=Sum('total_amount'),
            used_amount=Sum('used_amount'),
            item_count=Count('id')
        ).order_by('-total_amount')

        ws2.append(['类别', '总额', '已使用', '项目数', '使用率(%)'])
        for stat in category_stats:
            total = stat['total_amount'] or Decimal('0')
            used = stat['used_amount'] or Decimal('0')
            usage_rate = (used / total * 100) if total > 0 else 0
            ws2.append([
                stat['category'],
                float(total),
                float(used),
                stat['item_count'],
                round(usage_rate, 2),
            ])

        # 设置样式
        for ws in [ws1, ws2]:
            header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
            header_font = Font(bold=True, color='FFFFFF')
            for cell in ws[1]:
                cell.fill = header_fill
                cell.font = header_font

        # 记录审计日志
        AuditLog.objects.create(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='EXPORT',
            module='report',
            target_type='analysis_report',
            ip=get_client_ip(request),
        )

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="analysis_report.xlsx"'
        wb.save(response)
        return response
