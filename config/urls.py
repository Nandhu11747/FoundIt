"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from users.views import (AdminDashboardView,AdminDashboardStatsView,)

from django.http import FileResponse
from django.conf import settings
from pathlib import Path

def service_worker(request):
    file_path = (
        Path(settings.BASE_DIR)
        / "static"
        / "js"
        / "service-worker.js"
    )

    return FileResponse(
        open(file_path, "rb"),
        content_type="application/javascript"
    )

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "login/",
        TemplateView.as_view(
            template_name="login.html"
        ),
        name="login-page",
    ),

    path(
        "signup/",
        TemplateView.as_view(
            template_name="signup.html"
        ),
        name="signup-page",
    ),

    path(
        "dashboard/",
        TemplateView.as_view(template_name="dashboard.html"),
        name="dashboard"
    ),
    
    path(
        "",
        TemplateView.as_view(
            template_name="index.html"
        ),
        name="home",
    ),

    path(
        "admin-dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard"
    ),

    path(
        "admin-dashboard/stats/",
        AdminDashboardStatsView.as_view(),
        name="admin-dashboard-stats"
    ),

    path(
        "admin-dashboard/users/",
        TemplateView.as_view(
            template_name="admin_user_management.html"
        ),
        name="admin-user-management"
    ),

    path(
        "admin-dashboard/reports/",
        TemplateView.as_view(
            template_name="admin_reports.html"
        ),
        name="admin-reports"
    ),

    path(
        "admin-dashboard/claims/",
        TemplateView.as_view(template_name="admin_claims.html"),
        name="admin-claims",
    ),

    path(
        "admin-dashboard/reports/<int:report_id>/",
        TemplateView.as_view(
            template_name="admin_report_details.html"
        ),
        name="admin-report-details",
    ),

    path(
        "profile/",
        TemplateView.as_view(template_name="profile.html"),
        name="profile",
    ),

    path(
        "service-worker.js",
        service_worker,
        name="service_worker"
    ),

    path("auth/", include("users.urls")),
    path("accounts/", include("allauth.urls")),

    path(
        "reports/",
        include("reports.urls")
    ),
    path("claims/", include("claims.urls")),

    path("notifications/", include("notifications.urls")),

]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )

if settings.DEBUG:
    import debug_toolbar

    urlpatterns += [
        path("__debug__/", include(debug_toolbar.urls)),
    ]