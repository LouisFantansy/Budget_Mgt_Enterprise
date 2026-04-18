from django.contrib import admin
from .models import PurchaseRequest, PurchaseItem


@admin.register(PurchaseRequest)
class PurchaseRequestAdmin(admin.ModelAdmin):
    list_display = ('request_no', 'budget', 'total_amount', 'urgency_level', 'status', 'created_at')
    list_filter = ('urgency_level', 'status', 'created_at')
    search_fields = ('request_no', 'purpose')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(PurchaseItem)
class PurchaseItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'request', 'quantity', 'unit_price', 'total_amount')
    search_fields = ('name', 'specification')
    readonly_fields = ('id',)
