from django.db import models
from django.conf import settings


class Report(models.Model):

    REPORT_TYPE_CHOICES = [
        ("lost", "Lost"),
        ("found", "Found"),
    ]

    STATUS_CHOICES = [
        ("lost", "Lost"),
        ("found", "Found"),
        ("claimed", "Claimed"),
        ("returned", "Returned"),
        ("closed", "Closed"),
    ]

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports"
    )

    item_name = models.CharField(
        max_length=150
    )

    type = models.CharField(
        max_length=10,
        choices=REPORT_TYPE_CHOICES
    )

    category = models.CharField(
        max_length=100
    )

    description = models.TextField()

    brand = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    color = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    condition = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    location = models.CharField(
        max_length=150
    )

    event_date = models.DateField()

    event_time = models.TimeField(
        blank=True,
        null=True
    )

    reward_offered = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    private_identification_details = models.TextField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="lost"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.item_name} - {self.type}"