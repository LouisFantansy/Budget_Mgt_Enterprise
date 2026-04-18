from django.contrib import admin
from .models import User, Role, Permission, UserRole, RolePermission


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'name', 'email', 'status', 'department', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('username', 'name', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name', 'is_system', 'created_at')
    search_fields = ('name', 'display_name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'module', 'action')
    list_filter = ('module',)
    search_fields = ('name', 'module', 'action')
    readonly_fields = ('id',)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    readonly_fields = ('id',)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    readonly_fields = ('id',)
