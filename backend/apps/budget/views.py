from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Sum

from .models import Budget, BudgetItem, BudgetStatus, BudgetChangeLog, BudgetVersionLog, BudgetDiff, PurchaseHistory
from .serializers import (
    BudgetSerializer, BudgetListSerializer, BudgetCreateSerializer,
    BudgetItemSerializer, BudgetItemListSerializer,
    BudgetChangeLogSerializer, BudgetVersionLogSerializer,
    BudgetDiffSerializer, PurchaseHistorySerializer,
    BudgetSubmitSerializer, BudgetApproveSerializer,
    BudgetItemBatchUpdateSerializer
)


class BudgetViewSet(viewsets.ModelViewSet):
    """预算管理"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Budget.objects.prefetch_related('items', 'change_logs')

        # 权限过滤
        if user.is_admin or user.is_first_budget_admin or user.is_first_budget_host or user.is_first_dept_head:
            # 系统管理员/一级部门角色可看所有
            pass
        elif user.is_budget_admin or user.is_second_dept_head:
            # 二级部门角色只看本部门
            if user.department:
                queryset = queryset.filter(department=user.department)
        elif user.is_engineer:
            queryset = queryset.none()
        else:
            queryset = queryset.none()

        # 筛选条件
        params = self.request.query_params
        if params.get('year'):
            queryset = queryset.filter(year=params.get('year'))
        if params.get('category'):
            queryset = queryset.filter(category=params.get('category'))
        if params.get('source'):
            queryset = queryset.filter(source=params.get('source'))
        if params.get('status'):
            queryset = queryset.filter(status=params.get('status'))
        if params.get('department_id'):
            queryset = queryset.filter(department_id=params.get('department_id'))
        if params.get('version_label'):
            queryset = queryset.filter(version_label=params.get('version_label'))

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return BudgetListSerializer
        elif self.action == 'create':
            return BudgetCreateSerializer
        return BudgetSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """获取预算条目列表"""
        budget = self.get_object()
        items = budget.items.filter(is_deleted=False)
        serializer = BudgetItemListSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """添加预算条目"""
        budget = self.get_object()
        data = request.data
        data['budget'] = budget.id
        data['template'] = budget.template_id
        data['created_by'] = request.user.id

        serializer = BudgetItemSerializer(data=data)
        if serializer.is_valid():
            item = serializer.save()
            # 记录修改日志
            BudgetChangeLog.objects.create(
                budget=budget,
                budget_item=item,
                operator=request.user,
                operator_role=self._get_user_role(request.user),
                change_type='CREATE',
                reason='新增预算条目'
            )
            # 更新预算总额
            self._recalculate_budget_total(budget)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'])
    def update_item(self, request, pk=None):
        """更新预算条目"""
        budget = self.get_object()
        item_id = request.data.get('item_id')
        try:
            item = budget.items.get(id=item_id, is_deleted=False)
        except BudgetItem.DoesNotExist:
            return Response({'error': '条目不存在'}, status=status.HTTP_404_NOT_FOUND)

        # 记录旧值
        old_data = dict(item.field_data)

        # 更新字段
        field_updates = request.data.get('field_data', {})
        for key, value in field_updates.items():
            item.field_data[key] = value

        # 更新内部评论
        if 'internal_comment' in request.data:
            item.internal_comment = request.data['internal_comment']

        item.save()

        # 记录修改日志（逐字段记录）
        for key, new_value in field_updates.items():
            old_value = old_data.get(key)
            if old_value != new_value:
                BudgetChangeLog.objects.create(
                    budget=budget,
                    budget_item=item,
                    operator=request.user,
                    operator_role=self._get_user_role(request.user),
                    change_type='UPDATE',
                    field_code=key,
                    field_name=self._get_field_name(budget, key),
                    old_value=str(old_value),
                    new_value=str(new_value),
                    reason=request.data.get('reason', '修改预算条目')
                )

        # 更新预算总额
        self._recalculate_budget_total(budget)

        serializer = BudgetItemSerializer(item)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def delete_item(self, request, pk=None):
        """删除预算条目（软删除）"""
        budget = self.get_object()
        item_id = request.data.get('item_id')
        try:
            item = budget.items.get(id=item_id, is_deleted=False)
            item.is_deleted = True
            item.save()

            # 记录修改日志
            BudgetChangeLog.objects.create(
                budget=budget,
                budget_item=item,
                operator=request.user,
                operator_role=self._get_user_role(request.user),
                change_type='DELETE',
                reason='删除预算条目'
            )

            # 更新预算总额
            self._recalculate_budget_total(budget)
            return Response({'message': '删除成功'})
        except BudgetItem.DoesNotExist:
            return Response({'error': '条目不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def batch_update_items(self, request, pk=None):
        """批量更新预算条目"""
        budget = self.get_object()
        serializer = BudgetItemBatchUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        item_ids = serializer.validated_data['item_ids']
        field_updates = serializer.validated_data['field_updates']

        with transaction.atomic():
            items = budget.items.filter(id__in=item_ids, is_deleted=False)
            for item in items:
                old_data = dict(item.field_data)
                for key, value in field_updates.items():
                    item.field_data[key] = value
                    # 记录修改日志
                    BudgetChangeLog.objects.create(
                        budget=budget,
                        budget_item=item,
                        operator=request.user,
                        operator_role=self._get_user_role(request.user),
                        change_type='UPDATE',
                        field_code=key,
                        field_name=self._get_field_name(budget, key),
                        old_value=str(old_data.get(key)),
                        new_value=str(value),
                        reason='批量修改'
                    )
                item.save()

            # 更新预算总额
            self._recalculate_budget_total(budget)

        return Response({'message': f'成功更新 {items.count()} 条记录'})

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """提交预算审批"""
        budget = self.get_object()

        # 检查权限：只有主二级部门预算管理员可以送审
        user = request.user
        if not (user.is_second_budget_admin_primary or user.is_first_budget_admin):
            return Response({'error': '无权送审'}, status=status.HTTP_403_FORBIDDEN)

        # 检查状态
        if budget.status != BudgetStatus.DRAFT:
            return Response({'error': '只有草稿状态可以送审'}, status=status.HTTP_400_BAD_REQUEST)

        # 计算与上一版本的差异
        prev_version = budget.get_previous_approved_version()
        if prev_version:
            self._generate_diff(budget, prev_version)

        budget.status = BudgetStatus.PENDING
        budget.submitted_at = timezone.now()
        budget.submitted_by = user
        budget.save()

        # 记录版本日志
        BudgetVersionLog.objects.create(
            budget=budget,
            action='SUBMIT',
            operator=user,
            from_version=budget.version_label,
            description='提交预算审批'
        )

        return Response({'message': '提交成功', 'version': budget.version_label})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """审批预算"""
        budget = self.get_object()
        serializer = BudgetApproveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data['action']
        comment = serializer.validated_data.get('comment', '')
        user = request.user

        # 检查权限
        if budget.source == 'GROUP_ALLOCATION':
            return Response({'error': '集团分摊预算不需要审批'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'APPROVE':
            # 审批通过，版本号 +1
            budget.status = BudgetStatus.APPROVED
            budget.approved_at = timezone.now()
            budget.approved_by = user
            old_version = budget.version_label
            budget.increment_major()
            budget.save()

            # 记录版本日志
            BudgetVersionLog.objects.create(
                budget=budget,
                action='APPROVE',
                operator=user,
                from_version=old_version,
                to_version=budget.version_label,
                description=f'审批通过: {comment}'
            )

            return Response({
                'message': '审批通过',
                'version': budget.version_label
            })
        else:
            # 驳回
            budget.status = BudgetStatus.REJECTED
            budget.save()

            # 记录版本日志
            BudgetVersionLog.objects.create(
                budget=budget,
                action='REJECT',
                operator=user,
                from_version=budget.version_label,
                description=f'审批驳回: {comment}'
            )

            return Response({'message': '已驳回'})

    @action(detail=True, methods=['post'])
    def revise(self, request, pk=None):
        """修订预算（Git模式：基于当前版本创建新版本）"""
        budget = self.get_object()
        user = request.user

        # 检查权限
        if not (user.is_budget_admin or user.is_first_budget_admin):
            return Response({'error': '无权修订'}, status=status.HTTP_403_FORBIDDEN)

        # 只有审批通过或驳回的预算可以修订
        if budget.status not in [BudgetStatus.APPROVED, BudgetStatus.REJECTED]:
            return Response({'error': '当前状态不可修订'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # 创建新版本
            new_budget = Budget.objects.create(
                budget_no=budget.budget_no,
                year=budget.year,
                category=budget.category,
                source=budget.source,
                department=budget.department,
                template=budget.template,
                task=budget.task,
                parent_version=budget,
                version_major=budget.version_major,
                version_minor=budget.version_minor + 1,
                version_label=f"v{budget.version_major}.{budget.version_minor + 1}",
                status=BudgetStatus.DRAFT,
                created_by=user
            )

            # 复制条目
            for item in budget.items.filter(is_deleted=False):
                BudgetItem.objects.create(
                    budget=new_budget,
                    template=item.template,
                    item_no=item.item_no,
                    field_data=dict(item.field_data),
                    computed_fields=dict(item.computed_fields),
                    internal_comment=item.internal_comment,
                    created_by=user
                )

            # 记录版本日志
            BudgetVersionLog.objects.create(
                budget=new_budget,
                action='BRANCH',
                operator=user,
                from_version=budget.version_label,
                to_version=new_budget.version_label,
                description='基于上一版本修订'
            )

        serializer = BudgetSerializer(new_budget)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def change_logs(self, request, pk=None):
        """获取修改留痕记录"""
        budget = self.get_object()
        logs = budget.change_logs.all()
        serializer = BudgetChangeLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def version_logs(self, request, pk=None):
        """获取版本演进历史"""
        budget = self.get_object()
        logs = budget.version_logs.all()
        serializer = BudgetVersionLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def diff(self, request, pk=None):
        """获取版本差异"""
        budget = self.get_object()
        # 获取与上一个审批通过版本的差异
        prev_version = budget.get_previous_approved_version()
        if not prev_version:
            return Response({'message': '没有上一个版本可对比'})

        # 查询或生成差异
        diff = BudgetDiff.objects.filter(
            current_budget=budget,
            compared_budget=prev_version
        ).first()

        if diff:
            serializer = BudgetDiffSerializer(diff)
            return Response(serializer.data)
        else:
            # 实时生成差异
            diff = self._generate_diff(budget, prev_version)
            serializer = BudgetDiffSerializer(diff)
            return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def generate_summary(self, request):
        """一级部门预算管理员：一键拉取生成预算总表"""
        user = request.user
        if not user.is_first_budget_admin:
            return Response({'error': '无权操作'}, status=status.HTTP_403_FORBIDDEN)

        year = request.data.get('year')
        if not year:
            return Response({'error': '请选择预算年度'}, status=status.HTTP_400_BAD_REQUEST)

        # 获取各部门最新审批通过的版本
        from apps.department.models import Department
        departments = Department.objects.filter(dept_type='SECOND', status='ACTIVE')

        summary_data = []
        for dept in departments:
            latest_budget = Budget.objects.filter(
                department=dept,
                year=year,
                status=BudgetStatus.APPROVED
            ).order_by('-version_major', '-version_minor').first()

            if latest_budget:
                summary_data.append({
                    'department_id': str(dept.id),
                    'department_name': dept.name,
                    'budget_id': str(latest_budget.id),
                    'version': latest_budget.version_label,
                    'total_amount': str(latest_budget.total_amount),
                    'item_count': latest_budget.items.filter(is_deleted=False).count()
                })

        return Response({
            'year': year,
            'department_count': len(summary_data),
            'departments': summary_data
        })

    def _get_user_role(self, user):
        """获取用户角色字符串"""
        if user.is_first_budget_admin:
            return '一级部门预算管理员'
        elif user.is_first_budget_host:
            return '一级部门预算管理员主办'
        elif user.is_first_dept_head:
            return '一级部门负责人'
        elif user.is_second_budget_admin_primary:
            return '主二级部门预算管理员'
        elif user.is_second_budget_admin_secondary:
            return '次二级部门预算管理员'
        elif user.is_second_dept_head:
            return '二级部门负责人'
        return '未知'

    def _get_field_name(self, budget, field_code):
        """获取字段显示名称"""
        try:
            field = budget.template.fields.filter(field_code=field_code).first()
            return field.field_name if field else field_code
        except:
            return field_code

    def _recalculate_budget_total(self, budget):
        """重新计算预算总额"""
        items = budget.items.filter(is_deleted=False)
        # 从field_data中读取金额和数量字段（根据模板配置）
        total_amount = 0
        total_quantity = 0
        for item in items:
            # 尝试从field_data中读取总价
            price = item.field_data.get('total_price') or item.field_data.get('total_amount')
            qty = item.field_data.get('total_qty') or item.field_data.get('total_quantity')
            if price:
                try:
                    total_amount += float(price)
                except:
                    pass
            if qty:
                try:
                    total_quantity += float(qty)
                except:
                    pass

        budget.total_amount = total_amount
        budget.total_quantity = total_quantity
        budget.save(update_fields=['total_amount', 'total_quantity', 'updated_at'])

    def _generate_diff(self, current_budget, compared_budget):
        """生成版本差异"""
        current_items = {str(item.id): item.field_data for item in current_budget.items.filter(is_deleted=False)}
        compared_items = {str(item.id): item.field_data for item in compared_budget.items.filter(is_deleted=False)}

        added = []
        deleted = []
        modified = []

        # 找出新增和修改的
        for item_id, data in current_items.items():
            if item_id not in compared_items:
                added.append({'item_id': item_id, 'data': data})
            elif data != compared_items[item_id]:
                modified.append({
                    'item_id': item_id,
                    'old': compared_items[item_id],
                    'new': data
                })

        # 找出删除的
        for item_id, data in compared_items.items():
            if item_id not in current_items:
                deleted.append({'item_id': item_id, 'data': data})

        diff = BudgetDiff.objects.create(
            current_budget=current_budget,
            compared_budget=compared_budget,
            added_count=len(added),
            deleted_count=len(deleted),
            modified_count=len(modified),
            diff_details={
                'added': added,
                'deleted': deleted,
                'modified': modified
            }
        )
        return diff


class PurchaseHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """历史采购记录（智能补全）"""
    permission_classes = [IsAuthenticated]
    serializer_class = PurchaseHistorySerializer

    def get_queryset(self):
        queryset = PurchaseHistory.objects.all()
        keyword = self.request.query_params.get('keyword')
        if keyword:
            queryset = queryset.filter(description__icontains=keyword)
        return queryset.order_by('-usage_count')[:20]

    @action(detail=False, methods=['get'])
    def suggest(self, request):
        """根据输入获取推荐"""
        keyword = request.query_params.get('keyword', '')
        if not keyword or len(keyword) < 2:
            return Response([])

        histories = PurchaseHistory.objects.filter(
            description__icontains=keyword
        ).order_by('-usage_count')[:10]

        data = []
        for h in histories:
            data.append({
                'id': str(h.id),
                'description': h.description,
                'specification': h.specification,
                'historical_price': str(h.historical_price),
                'suggested_price': str(h.suggested_price),
                'supplier': h.supplier
            })

        return Response(data)
