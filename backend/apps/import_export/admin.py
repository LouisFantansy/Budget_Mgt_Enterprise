from django.contrib import admin
from .models import PurchaseOrder, Settlement, DataMapping, Attachment


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('order_no', 'supplier', 'amount', 'order_date', 'status', 'budget_no')
    list_filter = ('status', 'order_date')
    search_fields = ('order_no', 'supplier', 'budget_no')
    readonly_fields = ('id', 'created_at')


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ('settlement_no', 'invoice_no', 'amount', 'settle_date', 'supplier', 'budget_no')
    list_filter = ('settle_date',)
    search_fields = ('settlement_no', 'invoice_no', 'supplier', 'budget_no')
    readonly_fields = ('id', 'created_at')


@admin.register(DataMapping)
class DataMappingAdmin(admin.ModelAdmin):
    list_display = ('budget_no', 'purchase_order_no', 'settlement_no', 'match_status', 'verified_at')
    list_filter = ('match_status', 'verified_at')
    search_fields = ('budget_no', 'purchase_order_no', 'settlement_no')
    readonly_fields = ('id', 'created_at')


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'file_size', 'mime_type', 'uploader_id', 'target_type', 'created_at')
    list_filter = ('target_type', 'mime_type', 'created_at')
    search_fields = ('file_name',)
    readonly_fields = ('id', 'created_at')
