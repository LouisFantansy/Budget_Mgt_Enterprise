import uuid
from django.db import models


class MatchStatus(models.TextChoices):
    FULL = 'FULL', '完全匹配'
    PARTIAL = 'PARTIAL', '部分匹配'
    NONE = 'NONE', '未匹配'


class PurchaseOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_no = models.CharField(max_length=50, unique=True, db_index=True)
    supplier = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    order_date = models.DateTimeField()
    status = models.CharField(max_length=20)
    budget_no = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    mapping_id = models.CharField(max_length=36, null=True, blank=True)
    import_batch_id = models.CharField(max_length=36)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'purchase_orders'


class Settlement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    settlement_no = models.CharField(max_length=50, unique=True, db_index=True)
    invoice_no = models.CharField(max_length=50, null=True, blank=True)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    settle_date = models.DateTimeField()
    supplier = models.CharField(max_length=200)
    budget_no = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    mapping_id = models.CharField(max_length=36, null=True, blank=True)
    import_batch_id = models.CharField(max_length=36)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'settlements'


class DataMapping(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget_no = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    purchase_order_no = models.CharField(max_length=50, null=True, blank=True)
    settlement_no = models.CharField(max_length=50, null=True, blank=True)
    match_status = models.CharField(max_length=10, choices=MatchStatus.choices, db_index=True)
    amount_diff = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.CharField(max_length=36, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'data_mappings'


class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_name = models.CharField(max_length=200)
    file_size = models.IntegerField()
    mime_type = models.CharField(max_length=100)
    storage_path = models.CharField(max_length=500)
    uploader_id = models.CharField(max_length=36, db_index=True)
    target_type = models.CharField(max_length=20, null=True, blank=True)  # PURCHASE, BUDGET
    target_id = models.CharField(max_length=36, null=True, blank=True, db_index=True)
    purchase_request = models.ForeignKey(
        'purchase.PurchaseRequest',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='attachments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attachments'
