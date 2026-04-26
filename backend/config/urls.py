from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.auth_user.urls')),
    # 后续模块路由在此添加
    path('api/', include('apps.department.urls')),
    path('api/', include('apps.budget.urls')),
    path('api/', include('apps.budget_template.urls')),
    path('api/', include('apps.special_requirement.urls')),
    path('api/', include('apps.workflow.urls')),
    path('api/', include('apps.notification.urls')),
    path('api/', include('apps.audit.urls')),
    path('api/', include('apps.report.urls')),
    path('api/', include('apps.import_export.urls')),
]
