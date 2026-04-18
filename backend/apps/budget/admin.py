from django.contrib import admin
from .models import Budget, BudgetItem, BudgetAdjustment


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('budget_no', 'name', 'department', 'type', 'year', 'total_amount', 'status', 'created_at')
    list_filter = ('type', 'status', 'year', 'created_at')
    search_fields = ('budget_no', 'name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(BudgetItem)
class BudgetItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'budget', 'category', 'total_amount', 'sort_order')
    list_filter = ('category',)
    search_fields = ('name', 'category')
    readonly_fields = ('id',)


@admin.register(BudgetAdjustment)
class BudgetAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('adjust_no', 'budget', 'original_amount', 'adjusted_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('adjust_no',)
    readonly_fields = ('id', 'created_at')
