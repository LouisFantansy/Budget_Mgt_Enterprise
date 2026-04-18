from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsAdmin
from common.utils import get_client_ip

from .models import Department, DepartmentStatus
from .serializers import (
    DepartmentSerializer,
    DepartmentTreeSerializer,
    DepartmentCreateSerializer,
    DepartmentUpdateSerializer,
)


def _log_audit(user, action, module, target_type=None, target_id=None,
               ip=None, user_agent=None, new_value=None):
    """记录审计日志"""
    from apps.audit.models import AuditLog
    AuditLog.objects.create(
        user_id=str(user.id),
        user_name=user.name or user.username,
        action=action,
        module=module,
        target_type=target_type,
        target_id=target_id,
        new_value=new_value,
        ip=ip,
        user_agent=user_agent,
    )


class DepartmentViewSet(ModelViewSet):
    """部门 CRUD + 树形查询"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return DepartmentCreateSerializer
        elif self.action in ('update', 'partial_update'):
            return DepartmentUpdateSerializer
        return DepartmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # 支持 status、level、parent 筛选
        status_param = self.request.query_params.get('status')
        level = self.request.query_params.get('level')
        parent_id = self.request.query_params.get('parentId')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if level is not None:
            queryset = queryset.filter(level=int(level))
        if parent_id is not None:
            if parent_id == '' or parent_id.lower() == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)

        return queryset

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """GET /api/departments/tree/ - 获取部门树"""
        root_departments = Department.objects.filter(
            parent__isnull=True, status='ACTIVE'
        ).order_by('sort_order', 'code')
        serializer = DepartmentTreeSerializer(root_departments, many=True)
        return Response({
            'code': 200,
            'message': 'success',
            'data': serializer.data,
        })

    def perform_create(self, serializer):
        department = serializer.save()
        _log_audit(
            user=self.request.user, action='CREATE', module='department',
            target_type='Department', target_id=str(department.id),
            ip=get_client_ip(self.request),
            new_value={'name': department.name, 'code': department.code},
        )

    def perform_update(self, serializer):
        department = serializer.save()
        _log_audit(
            user=self.request.user, action='UPDATE', module='department',
            target_type='Department', target_id=str(department.id),
            ip=get_client_ip(self.request),
        )

    def destroy(self, request, *args, **kwargs):
        department = self.get_object()
        # 检查是否有子部门
        if department.children.filter(status='ACTIVE').exists():
            return Response(
                {'code': 400, 'message': '该部门下有子部门，无法删除', 'data': None},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # 检查是否有关联用户
        if department.users.filter(status='ACTIVE').exists():
            return Response(
                {'code': 400, 'message': '该部门下有用户，无法删除', 'data': None},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # 软删除
        department.status = DepartmentStatus.INACTIVE
        department.save(update_fields=['status', 'updated_at'])

        _log_audit(
            user=request.user, action='DELETE', module='department',
            target_type='Department', target_id=str(department.id),
            ip=get_client_ip(request),
            new_value={'status': 'INACTIVE'},
        )

        return Response({
            'code': 200,
            'message': '删除成功',
            'data': None,
        })
