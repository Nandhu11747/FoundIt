from django.urls import path

from .views import (
    CreateReportView,
    MyReportsView,
)
from django.views.generic import TemplateView


urlpatterns = [

    path(
        "",
        CreateReportView.as_view(),
        name="create-report"
    ),

    path(
        "my/",
        MyReportsView.as_view(),
        name="my-reports"
    ),

    path(
        "lost/",
        TemplateView.as_view(
            template_name="report_lost.html"
        ),
        name="report-lost"
    ),

]