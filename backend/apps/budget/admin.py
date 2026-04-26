from django.contrib import admin
from .models import Budget, BudgetItem, BudgetChangeLog, BudgetVersionLog, BudgetDiff, PurchaseHistory


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('budget_no', 'year', 'category', 'source', 'department', 'version_label', 'status', 'total_amount', 'created_at')
    list_filter = ('category', 'source', 'status', 'year', 'created_at')
    search_fields = ('budget_no',)
    readonly_fields = ('id', 'version_label', 'created_at', 'updated_at')


@admin.register(BudgetItem)
class BudgetItemAdmin(admin.ModelAdmin):
    list_display = ('budget', 'item_no', 'is_deleted', 'created_at')
    list_filter = ('is_deleted',)
    readonly_fields = ('id',)


@admin.register(BudgetChangeLog)
class BudgetChangeLogAdmin(admin.ModelAdmin):
    list_display = ('budget', 'change_type', 'field_code', 'operator', 'created_at')
    list_filter = ('change_type', 'created_at')
    readonly_fields = ('id', 'created_at')


@admin.register(BudgetVersionLog)
class BudgetVersionLogAdmin(admin.ModelAdmin):
    list_display = ('budget', 'action', 'from_version', 'to_version', 'operator', 'created_at')
    list_filter = ('action', 'created_at')
    readonly_fields = ('id', 'created_at')


@admin.register(BudgetDiff)
class BudgetDiffAdmin(admin.ModelAdmin):
    list_display = ('current_budget', 'compared_budget', 'added_count', 'deleted_count', 'modified_count', 'generated_at')
    readonly_fields = ('id', 'generated_at')


@admin.register(PurchaseHistory)
class PurchaseHistoryAdmin(admin.ModelAdmin):
    list_display = ('description', 'historical_price', 'suggested_price', 'usage_count', 'created_at')
    search_fields = ('description', 'specification')
    readonly_fields = ('id', 'created_at', 'updated_at')
