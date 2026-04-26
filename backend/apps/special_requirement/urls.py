from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RequirementTemplateViewSet, SpecialRequirementViewSet

router = DefaultRouter()
router.register(r'requirement-templates', RequirementTemplateViewSet, basename='requirement-template')
router.register(r'special-requirements', SpecialRequirementViewSet, basename='special-requirement')

urlpatterns = [
    path('', include(router.urls)),
]
