"""审计日志服务 - 内部使用"""

from .models import AuditLog


class AuditService:
    """审计服务类"""

    @staticmethod
    def log(user_id, user_name, action, module, target_type=None, target_id=None,
            old_value=None, new_value=None, ip=None, user_agent=None):
        """
        记录审计日志

        Args:
            user_id: 用户ID
            user_name: 用户名
            action: 操作类型 (CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, EXPORT, etc.)
            module: 模块 (budget, purchase, approval, user, system, etc.)
            target_type: 目标类型（可选）
            target_id: 目标ID（可选）
            old_value: 旧值（JSON，可选）
            new_value: 新值（JSON，可选）
            ip: IP地址（可选）
            user_agent: 用户代理（可选）

        Returns:
            AuditLog: 创建的审计日志对象
        """
        return AuditLog.objects.create(
            user_id=user_id,
            user_name=user_name,
            action=action,
            module=module,
            target_type=target_type,
            target_id=target_id,
            old_value=old_value,
            new_value=new_value,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_create(user, module, target_type, target_id, new_value, ip=None, user_agent=None):
        """记录创建操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='CREATE',
            module=module,
            target_type=target_type,
            target_id=target_id,
            new_value=new_value,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_update(user, module, target_type, target_id, old_value, new_value, ip=None, user_agent=None):
        """记录更新操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='UPDATE',
            module=module,
            target_type=target_type,
            target_id=target_id,
            old_value=old_value,
            new_value=new_value,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_delete(user, module, target_type, target_id, old_value=None, ip=None, user_agent=None):
        """记录删除操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='DELETE',
            module=module,
            target_type=target_type,
            target_id=target_id,
            old_value=old_value,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_approve(user, module, target_type, target_id, comment=None, ip=None, user_agent=None):
        """记录审批通过操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='APPROVE',
            module=module,
            target_type=target_type,
            target_id=target_id,
            new_value={'comment': comment} if comment else None,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_reject(user, module, target_type, target_id, reason=None, ip=None, user_agent=None):
        """记录审批驳回操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='REJECT',
            module=module,
            target_type=target_type,
            target_id=target_id,
            new_value={'reason': reason} if reason else None,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_export(user, module, export_type, filters=None, ip=None, user_agent=None):
        """记录导出操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='EXPORT',
            module=module,
            target_type=export_type,
            new_value={'filters': filters} if filters else None,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_import(user, module, import_type, batch_id=None, record_count=None, ip=None, user_agent=None):
        """记录导入操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='IMPORT',
            module=module,
            target_type=import_type,
            new_value={
                'batch_id': batch_id,
                'record_count': record_count,
            } if batch_id or record_count else None,
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_login(user, ip=None, user_agent=None):
        """记录登录操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='LOGIN',
            module='system',
            ip=ip,
            user_agent=user_agent,
        )

    @staticmethod
    def log_logout(user, ip=None, user_agent=None):
        """记录登出操作"""
        return AuditService.log(
            user_id=str(user.id),
            user_name=user.name or user.username,
            action='LOGOUT',
            module='system',
            ip=ip,
            user_agent=user_agent,
        )
