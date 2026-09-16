from django.db import models
from django.conf import settings

from reports.models import Report


class Claim(models.Model):

    CLAIM_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    id = models.BigAutoField(primary_key=True)

    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name="claims"
    )

    claimant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="claims"
    )

    unique_identification_details = models.TextField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=CLAIM_STATUS_CHOICES,
        default="pending"
    )

    reviewed_at = models.DateTimeField(
        blank=True,
        null=True
    )

    rejection_reason = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"Claim #{self.id} - "
            f"Report #{self.report.id}"
        )


class ClaimEvidence(models.Model):

    id = models.BigAutoField(primary_key=True)

    claim = models.ForeignKey(
        Claim,
        on_delete=models.CASCADE,
        related_name="evidence"
    )

    evidence_url = models.FileField(
        upload_to="claim_evidence/",
        max_length=500
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Evidence for Claim #{self.claim.id}"


class ClaimVerification(models.Model):

    VERIFICATION_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
    ]

    id = models.BigAutoField(primary_key=True)

    claim = models.OneToOneField(
        Claim,
        on_delete=models.CASCADE,
        related_name="verification"
    )

    owner_id_verified = models.BooleanField(
        default=False
    )

    item_visual_match = models.BooleanField(
        default=False
    )

    location_proximity = models.BooleanField(
        default=False
    )

    ownership_proof = models.BooleanField(
        default=False
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default="pending"
    )

    match_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )

    verified_at = models.DateTimeField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Verification for Claim #{self.claim.id}"