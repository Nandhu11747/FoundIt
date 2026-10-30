from django.urls import path
from django.views.generic import TemplateView
from django.conf import settings

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
        TemplateView.as_view(
            template_name="notifications.html",
            extra_context={
                "vapid_public_key": settings.VAPID_PUBLIC_KEY,
            },
        ),
        name="notifications-page",
    ),
]
