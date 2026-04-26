from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone

from .models import RequirementTemplate, RequirementTemplateField, RequirementTemplateOption, SpecialRequirement
from .serializers import (
    RequirementTemplateListSerializer,
    RequirementTemplateDetailSerializer,
    RequirementTemplateCreateSerializer,
    RequirementTemplateFieldSerializer,
    RequirementTemplateOptionSerializer,
    SpecialRequirementListSerializer,
    SpecialRequirementDetailSerializer,
    SpecialRequirementCreateSerializer,
    SpecialRequirementApproveSerializer,
)


class RequirementTemplateViewSet(viewsets.ModelViewSet):
    """专题需求收集表模板管理"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RequirementTemplate.objects.prefetch_related('fields', 'fields__options').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return RequirementTemplateListSerializer
        elif self.action == 'create':
            return RequirementTemplateCreateSerializer
        return RequirementTemplateDetailSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_field(self, request, pk=None):
        """添加字段到模板"""
        template = self.get_object()
        data = request.data
        data['template'] = template.id
        serializer = RequirementTemplateFieldSerializer(data=data)
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
        except RequirementTemplateField.DoesNotExist:
            return Response({'error': '字段不存在'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RequirementTemplateFieldSerializer(field, data=request.data, partial=True)
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
            field.delete()
            return Response({'message': '删除成功'})
        except RequirementTemplateField.DoesNotExist:
            return Response({'error': '字段不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """克隆模板"""
        template = self.get_object()
        with transaction.atomic():
            new_template = RequirementTemplate.objects.create(
                name=f"{template.name} (副本)",
                template_type=template.template_type,
                description=template.description,
                creator=request.user
            )
            for field in template.fields.all():
                new_field = RequirementTemplateField.objects.create(
                    template=new_template,
                    field_code=field.field_code,
                    field_name=field.field_name,
                    field_type=field.field_type,
                    is_hidden=field.is_hidden,
                    is_public=field.is_public,
                    is_required=field.is_required,
                    default_value=field.default_value,
                    sort_order=field.sort_order
                )
                for option in field.options.all():
                    RequirementTemplateOption.objects.create(
                        field=new_field,
                        option_value=option.option_value,
                        option_label=option.option_label,
                        sort_order=option.sort_order
                    )
        serializer = RequirementTemplateDetailSerializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SpecialRequirementViewSet(viewsets.ModelViewSet):
    """专题需求收集表实例管理"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = SpecialRequirement.objects.select_related('template', 'department', 'filled_by')

        if user.is_first_budget_admin or user.is_first_budget_host:
            pass
        elif user.is_second_budget_admin_primary or user.is_second_budget_admin_secondary or user.is_second_dept_head:
            if user.department:
                queryset = queryset.filter(department=user.department)
        else:
            queryset = queryset.none()

        params = self.request.query_params
        if params.get('year'):
            queryset = queryset.filter(year=params.get('year'))
        if params.get('status'):
            queryset = queryset.filter(status=params.get('status'))
        if params.get('template_id'):
            queryset = queryset.filter(template_id=params.get('template_id'))
        if params.get('department_id'):
            queryset = queryset.filter(department_id=params.get('department_id'))

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return SpecialRequirementListSerializer
        elif self.action == 'create':
            return SpecialRequirementCreateSerializer
        return SpecialRequirementDetailSerializer

    def perform_create(self, serializer):
        serializer.save(filled_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """提交专题需求收集表"""
        req = self.get_object()
        user = request.user

        if req.status != 'DRAFT':
            return Response({'error': '只有草稿状态可以提交'}, status=status.HTTP_400_BAD_REQUEST)

        req.status = 'SUBMITTED'
        req.save()
        return Response({'message': '提交成功', 'status': req.status})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """审批专题需求收集表"""
        req = self.get_object()
        user = request.user
        serializer = SpecialRequirementApproveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data['action']
        comment = serializer.validated_data.get('comment', '')

        if not (user.is_first_budget_admin or user.is_first_dept_head):
            return Response({'error': '无权审批'}, status=status.HTTP_403_FORBIDDEN)

        if req.status != 'SUBMITTED':
            return Response({'error': '只有已提交状态可以审批'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'APPROVE':
            req.status = 'APPROVED'
            req.save()
            return Response({'message': '审批通过', 'status': req.status})
        else:
            req.status = 'REJECTED'
            req.save()
            return Response({'message': '已驳回', 'status': req.status})

    @action(detail=False, methods=['get'])
    def my_requirements(self, request):
        """获取我填写的专题需求收集表"""
        queryset = self.get_queryset().filter(filled_by=request.user)
        serializer = SpecialRequirementListSerializer(queryset, many=True)
        return Response(serializer.data)
