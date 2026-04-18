from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ImportViewSet, MappingViewSet, ExportViewSet

router = DefaultRouter()
router.register('import', ImportViewSet, basename='import')
router.register('mappings', MappingViewSet, basename='mapping')
router.register('export', ExportViewSet, basename='export')

urlpatterns = [
    path('', include(router.urls)),
]
