from django.urls import path

from .views import (
    CreateReportView,
    MyReportsView,
    MyMatchesView,
    BrowseItemsView,
    FoundReportMatchesView,
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
        "matches/",
        MyMatchesView.as_view(),
        name="my-matches"
    ),

    path(
        "lost/",
        TemplateView.as_view(
            template_name="report_lost.html"
        ),
        name="report-lost"
    ),

    path(
        "found/",
        TemplateView.as_view(
            template_name="report_found.html"
        ),
        name="report-found"
    ),

    path(
        "browse/",
        BrowseItemsView.as_view(),
        name="browse-items"
    ),

    path(
        "browse/page/",
        TemplateView.as_view(template_name="browse_items.html"),
        name="browse-items-page",
    ),
    path(
        "item/<int:report_id>/",
        TemplateView.as_view(
            template_name="item_details.html"
        ),
        name="item-details-page",
    ),

    path(
        "item/<int:report_id>/matches/",
        FoundReportMatchesView.as_view(),
        name="found-report-matches",
    ),



]