
import json
from pathlib import Path

from django.conf import settings
from pywebpush import webpush, WebPushException

from users.models import PushSubscription


def send_push_notification(user, title, body, url="/notifications/page/"):
    subscriptions = PushSubscription.objects.filter(user=user)

    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {
                        "p256dh": subscription.p256dh,
                        "auth": subscription.auth,
                    },
                },
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "url": url,
                }),
                vapid_private_key=str(settings.VAPID_PRIVATE_KEY_PATH),
                vapid_claims={
                    "sub": "mailto:admin@foundit.local"
                },
            )
        except WebPushException as error:
            print(f"Push notification failed: {error}")
