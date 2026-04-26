from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone

from .models import BudgetTemplate, TemplateField, TemplateFieldOption, BudgetTask
from .serializers import (
    BudgetTemplateSerializer, BudgetTemplateListSerializer,
    TemplateFieldSerializer, BudgetTaskSerializer
)


class BudgetTemplateViewSet(viewsets.ModelViewSet):
    """预算编制表单模板管理"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = BudgetTemplate.objects.prefetch_related('fields', 'fields__options')
        # 筛选条件
        year = self.request.query_params.get('year')
        category = self.request.query_params.get('category')
        status = self.request.query_params.get('status')

        if year:
            queryset = queryset.filter(year=year)
        if category:
            queryset = queryset.filter(category=category)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return BudgetTemplateListSerializer
        return BudgetTemplateSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_field(self, request, pk=None):
        """添加字段到模板"""
        template = self.get_object()
        data = request.data
        data['template'] = template.id

        serializer = TemplateFieldSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'])
    def update_field(self, request, pk=None):
        """更新模板字段"""
        template = self.get_object()
        field_id = request.data.get('field_id')
        try:
            field = template.fields.get(id=field_id)
        except TemplateField.DoesNotExist:
            return Response({'error': '字段不存在'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TemplateFieldSerializer(field, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def delete_field(self, request, pk=None):
        """删除模板字段"""
        template = self.get_object()
        field_id = request.data.get('field_id')
        try:
            field = template.fields.get(id=field_id)
            if field.is_system:
                return Response({'error': '系统预设字段不可删除'}, status=status.HTTP_400_BAD_REQUEST)
            field.delete()
            return Response({'message': '删除成功'})
        except TemplateField.DoesNotExist:
            return Response({'error': '字段不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def reorder_fields(self, request, pk=None):
        """重新排序字段"""
        template = self.get_object()
        field_orders = request.data.get('field_orders', [])  # [{field_id: xxx, sort_order: 1}, ...]

        with transaction.atomic():
            for item in field_orders:
                template.fields.filter(id=item['field_id']).update(sort_order=item['sort_order'])

        return Response({'message': '排序已更新'})

    @action(detail=True, methods=['post'])
    def trigger_task(self, request, pk=None):
        """触发预算编制任务"""
        template = self.get_object()
        department_ids = request.data.get('department_ids', [])

        if not department_ids:
            return Response({'error': '请选择目标部门'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            from apps.department.models import Department

            departments = Department.objects.filter(id__in=department_ids, dept_type='SECOND')
            created_tasks = []

            for dept in departments:
                # 获取部门的主预算管理员
                if dept.primary_budget_admin:
                    task, created = BudgetTask.objects.get_or_create(
                        template=template,
                        department=dept,
                        defaults={
                            'assigned_to': dept.primary_budget_admin,
                            'status': 'PENDING'
                        }
                    )
                    if created:
                        created_tasks.append(task.id)

            # 更新模板状态
            template.task_triggered = True
            template.triggered_at = timezone.now()
            template.status = 'ACTIVE'
            template.save()

        return Response({
            'message': f'已成功触发 {len(created_tasks)} 个编制任务',
            'task_count': len(created_tasks)
        })

    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """克隆模板"""
        template = self.get_object()

        with transaction.atomic():
            # 创建新模板
            new_template = BudgetTemplate.objects.create(
                name=f"{template.name} (复制)",
                category=template.category,
                is_group_allocation=template.is_group_allocation,
                year=template.year,
                version=template.version + 1,
                status='DRAFT',
                creator=request.user
            )

            # 复制字段
            for field in template.fields.all():
                new_field = TemplateField.objects.create(
                    template=new_template,
                    field_code=field.field_code,
                    field_name=field.field_name,
                    field_type=field.field_type,
                    sort_order=field.sort_order,
                    is_visible=field.is_visible,
                    is_editable=field.is_editable,
                    is_required=field.is_required,
                    default_value=field.default_value,
                    width=field.width,
                    formula=field.formula,
                    is_system=field.is_system,
                    is_extension=field.is_extension
                )

                # 复制下拉选项
                for option in field.options.all():
                    TemplateFieldOption.objects.create(
                        field=new_field,
                        option_value=option.option_value,
                        option_label=option.option_label,
                        sort_order=option.sort_order
                    )

        serializer = BudgetTemplateSerializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BudgetTaskViewSet(viewsets.ModelViewSet):
    """预算编制任务管理"""
    permission_classes = [IsAuthenticated]
    serializer_class = BudgetTaskSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = BudgetTask.objects.select_related('template', 'department', 'assigned_to')

        # 一级预算管理员可看所有任务
        if user.is_first_budget_admin:
            pass
        # 二级预算管理员只看分配给自己的任务
        elif user.is_budget_admin:
            queryset = queryset.filter(assigned_to=user)
        else:
            queryset = queryset.none()

        # 筛选
        status = self.request.query_params.get('status')
        year = self.request.query_params.get('year')

        if status:
            queryset = queryset.filter(status=status)
        if year:
            queryset = queryset.filter(template__year=year)

        return queryset
