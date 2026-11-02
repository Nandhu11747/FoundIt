
import json
import base64

from django.conf import settings
from pywebpush import webpush, WebPushException
from cryptography.hazmat.primitives import serialization

from users.models import PushSubscription

def send_push_notification(user, title, body, url="/notifications/page/"):
    subscriptions = PushSubscription.objects.filter(user=user)

    pem_key = settings.VAPID_PRIVATE_KEY_PATH.read_bytes()

    private_key = serialization.load_pem_private_key(
        pem_key,
        password=None
    )

    der_key = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    vapid_private_key = base64.urlsafe_b64encode(
        der_key
    ).rstrip(b"=").decode("utf-8")

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
                vapid_private_key=vapid_private_key,
                vapid_claims={
                    "sub": "mailto:admin@foundit.local"
                },
            )
        except WebPushException as error:
            status_code = (
                error.response.status_code
                if error.response is not None
                else None
            )

            if status_code in [404, 410]:
                subscription_id = subscription.id
                subscription.delete()

                print(
                    f"Deleted expired push subscription: {subscription_id}"
                )
            else:
                print(f"Push notification failed: {error}")
        except Exception as error:
            print(f"Unexpected push notification error: {error}")