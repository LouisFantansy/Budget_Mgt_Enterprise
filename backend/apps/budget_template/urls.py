from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BudgetTemplateViewSet, BudgetTaskViewSet

router = DefaultRouter()
router.register(r'templates', BudgetTemplateViewSet, basename='budget-template')
router.register(r'tasks', BudgetTaskViewSet, basename='budget-task')

urlpatterns = [
    path('', include(router.urls)),
]
