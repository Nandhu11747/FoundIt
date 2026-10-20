
from django.db import models
from django.conf import settings


class Notification(models.Model):

    NOTIFICATION_TYPES = [
        ("match_found", "Potential Match Found"),
        ("claim_submitted", "Claim Submitted"),
        ("claim_approved", "Claim Approved"),
        ("claim_rejected", "Claim Rejected"),
        ("system", "System Notification"),
    ]

    id = models.BigAutoField(primary_key=True)

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    title = models.CharField(max_length=150)

    message = models.TextField()

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES,
        default="system"
    )

    related_url = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.recipient}"
