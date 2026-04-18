from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'level', 'parent', 'status', 'sort_order', 'created_at')
    list_filter = ('level', 'status', 'created_at')
    search_fields = ('name', 'code')
    readonly_fields = ('id', 'created_at', 'updated_at')
