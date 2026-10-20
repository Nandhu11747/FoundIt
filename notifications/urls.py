from django.urls import path
from django.views.generic import TemplateView

from .views import (
    NotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path(
        "<int:notification_id>/read/",
        MarkNotificationReadView.as_view(),
        name="notification-read",
    ),
    path(
        "read-all/",
        MarkAllNotificationsReadView.as_view(),
        name="notification-read-all",
    ),
    path(
        "page/",
        TemplateView.as_view(template_name="notifications.html"),
        name="notifications-page",
    ),
]
