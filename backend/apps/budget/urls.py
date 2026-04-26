from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BudgetViewSet, PurchaseHistoryViewSet

router = DefaultRouter()
router.register('budgets', BudgetViewSet, basename='budget')
router.register('purchase-history', PurchaseHistoryViewSet, basename='purchase-history')

urlpatterns = [
    path('', include(router.urls)),
]
