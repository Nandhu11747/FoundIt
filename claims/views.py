from notifications.models import Notification
from urllib import request
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Claim, ClaimEvidence,ClaimVerification
from reports.models import Report, Match
from django.utils import timezone
from django.db import transaction

class CreateClaimView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        report_id = request.data.get("report_id")
        unique_details = request.data.get(
            "unique_identification_details"
        )
        description = request.data.get("description")
        match_id = request.data.get("match_id")

        print("DEBUG request.data:", request.data)
        print("DEBUG match_id:", match_id)

        if not report_id:
            return Response(
                {"error": "Report ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not match_id:
            return Response(
                {"error": "Match ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            match = Match.objects.get(
                id=match_id,
                status="pending"
            )
        except Match.DoesNotExist:
            return Response(
                {"error": "Valid pending match not found."},
                status=status.HTTP_404_NOT_FOUND
            )
                
        try:
            report = Report.objects.get(
                id=report_id,
                type="lost"
            )
        except Report.DoesNotExist:
            return Response(
                {"error": "Lost report not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Make sure this user owns the Lost Report
        if report.user != request.user:
            return Response(
                {"error": "You can only claim your own lost report."},
                status=status.HTTP_403_FORBIDDEN
            )

        
        # Make sure the selected match belongs to this Lost Report
        if match.lost_report_id != report.id:
            return Response(
                {"error": "The selected match does not belong to this lost report."},
                status=status.HTTP_400_BAD_REQUEST
            )


        # Make sure a potential match exists
        match_exists = Match.objects.filter(
            lost_report=report
        ).exists()

        if not match_exists:
            return Response(
                {"error": "No potential match found for this report."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent duplicate pending/approved claims
        existing_claim = Claim.objects.filter(
            report=report,
            claimant=request.user,
            status__in=["pending", "approved"]
        ).first()

        if existing_claim:
            return Response(
                {
                    "error": "You already have an active claim for this report.",
                    "claim_id": existing_claim.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        claim = Claim.objects.create(
            report=report,
            match=match,
            claimant=request.user,
            unique_identification_details=unique_details,
            status="pending"
        )

        ClaimVerification.objects.create(
            claim=claim,
            verification_status="pending",
            match_score=0
        )
        # Ownership evidence uploaded by the owner
        evidence = request.FILES.get("evidence")

        if evidence:
            ClaimEvidence.objects.create(
                claim=claim,
                evidence_url=evidence,
                description=description
            )

        return Response(
            {
                "message": "Claim submitted successfully.",
                "claim_id": claim.id,
                "report_id": report.id,
                "status": claim.status
            },
            status=status.HTTP_201_CREATED
        )

class MyClaimsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        claims = Claim.objects.filter(
            claimant=request.user
        ).select_related(
            "report",
            "match",
            "match__found_report"
        ).order_by("-created_at")

        data = []

        for claim in claims:
            match = claim.match

            data.append({
                "claim_id": claim.id,
                "status": claim.status,
                "created_at": claim.created_at,
                "unique_identification_details":
                    claim.unique_identification_details,
                "rejection_reason": claim.rejection_reason,
                "lost_report": {
                    "id": claim.report.id,
                    "item_name": claim.report.item_name,
                },
                "found_report": {
                    "id": match.found_report.id,
                    "item_name": match.found_report.item_name,
                } if match else None,
                "match_status": match.status if match else None,
            })

        return Response(data, status=status.HTTP_200_OK)


class MatchDetailsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, match_id):

        try:
            match = Match.objects.select_related(
                "lost_report",
                "found_report"
            ).get(
                id=match_id
            )

        except Match.DoesNotExist:
            return Response(
                {"error": "Match not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only the owner of the Lost Report can view this match
        if match.lost_report.user != request.user:
            return Response(
                {"error": "You are not allowed to view this match."},
                status=status.HTTP_403_FORBIDDEN
            )

        found_report = match.found_report

        # Get the first image of the found item
        image = found_report.images.first()

        image_url = None

        if image:
            image_url = request.build_absolute_uri(
                image.image_url.url
            )

        return Response(
            {
                "match_id": match.id,
                "match_score": match.match_score,
                "status": match.status,
                "lost_report_id": match.lost_report.id,

                "found_report": {
                    "id": found_report.id,
                    "item_name": found_report.item_name,
                    "category": found_report.category,
                    "description": found_report.description,
                    "location": found_report.location,
                    "event_date": found_report.event_date,
                    "event_time": found_report.event_time,
                    "image_url": image_url,
                }
            },
            status=status.HTTP_200_OK
        )

class AdminPendingClaimsView(APIView):
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        claims = Claim.objects.filter(
            status="pending"
        ).select_related(
            "report",
            "claimant"
        ).prefetch_related(
            "evidence"
        ).order_by("-created_at")

        data = []

        for claim in claims:
            data.append({
                "claim_id": claim.id,
                "report_id": claim.report.id,
                "claimant_id": claim.claimant.id,
                "claimant_name": claim.claimant.full_name,
                "claimant_email": claim.claimant.email,
                "item_name": claim.report.item_name,
                "category": claim.report.category,
                "location": claim.report.location,
                "event_date": claim.report.event_date,
                "unique_identification_details": claim.unique_identification_details,
                "status": claim.status,
                "created_at": claim.created_at,
                "evidence_count": claim.evidence.count(),
            })

        return Response(
            data,
            status=status.HTTP_200_OK
        )

class AdminClaimVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, claim_id):

        # Only superusers can access claim verification
        if not request.user.is_superuser:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            claim = Claim.objects.select_related(
                "claimant",
                "report"
            ).get(id=claim_id)

        except Claim.DoesNotExist:
            return Response(
                {"error": "Claim not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        lost_report = claim.report

        # Find the matching found report
        # Get the exact match linked to this claim
        match = claim.match

        if not match:
            return Response(
                {"error": "No matching found report exists."},
                status=status.HTTP_404_NOT_FOUND
            )

        found_report = match.found_report

        # Get verification record
        verification = getattr(claim, "verification", None)

        # Get claim evidence
        evidence_list = []

        for evidence in claim.evidence.all():
            evidence_list.append({
                "id": evidence.id,
                "url": request.build_absolute_uri(
                    evidence.evidence_url.url
                ),
                "description": evidence.description,
                "created_at": evidence.created_at,
            })

        # Get found report image
        found_image = found_report.images.first()

        found_image_url = None

        if found_image:
            found_image_url = request.build_absolute_uri(
                found_image.image_url.url
            )

        # Get lost report image
        lost_image = lost_report.images.first()

        lost_image_url = None

        if lost_image:
            lost_image_url = request.build_absolute_uri(
                lost_image.image_url.url
            )

        return Response(
            {
                "claim": {
                    "id": claim.id,
                    "status": claim.status,
                    "created_at": claim.created_at,
                    "unique_identification_details":
                        claim.unique_identification_details,
                    "rejection_reason": claim.rejection_reason,
                },

                "claimant": {
                    "id": claim.claimant.id,
                    "full_name": claim.claimant.full_name,
                    "email": claim.claimant.email,
                    "phone": claim.claimant.phone,
                },

                "lost_report": {
                    "id": lost_report.id,
                    "item_name": lost_report.item_name,
                    "category": lost_report.category,
                    "description": lost_report.description,
                    "brand": lost_report.brand,
                    "color": lost_report.color,
                    "condition": lost_report.condition,
                    "location": lost_report.location,
                    "event_date": lost_report.event_date,
                    "event_time": lost_report.event_time,
                    "status": lost_report.status,
                    "image_url": lost_image_url,
                    "tags": list(
                        lost_report.tags.values_list("tag", flat=True)
                    ),
                },

                "found_report": {
                    "id": found_report.id,
                    "item_name": found_report.item_name,
                    "category": found_report.category,
                    "description": found_report.description,
                    "brand": found_report.brand,
                    "color": found_report.color,
                    "condition": found_report.condition,
                    "location": found_report.location,
                    "event_date": found_report.event_date,
                    "event_time": found_report.event_time,
                    "status": found_report.status,
                    "image_url": found_image_url,
                    "tags": list(
                        found_report.tags.values_list("tag", flat=True)
                    ),
                },

                "finder": {
                    "id": found_report.user.id,
                    "full_name": found_report.user.full_name,
                    "email": found_report.user.email,
                    "phone": found_report.user.phone,
                },

                "match": {
                    "id": match.id,
                    "score": match.match_score,
                    "status": match.status,
                },

                "verification": {
                    "owner_id_verified":
                        verification.owner_id_verified
                        if verification else False,

                    "item_visual_match":
                        verification.item_visual_match
                        if verification else False,

                    "location_proximity":
                        verification.location_proximity
                        if verification else False,

                    "ownership_proof":
                        verification.ownership_proof
                        if verification else False,

                    "verification_status":
                        verification.verification_status
                        if verification else "pending",

                    "match_score":
                        verification.match_score
                        if verification else 0,
                },

                "evidence": evidence_list,
            },
            status=status.HTTP_200_OK
        )
class ApproveClaimView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, claim_id):

        if not request.user.is_superuser:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            claim = Claim.objects.get(id=claim_id)
        except Claim.DoesNotExist:
            return Response(
                {"error": "Claim not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if claim.status != "pending":
            return Response(
                {"error": "Only pending claims can be approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        claim.status = "approved"
        claim.reviewed_at = timezone.now()
        claim.save()

        Notification.objects.create(
            recipient=claim.claimant,
            title="Claim Approved",
            message=f"Your claim #{claim.id} has been approved.",
            notification_type="claim_approved",
            related_url="/claims/page/my/",
        )

        match = claim.match

        if match:
            match.status = "confirmed"
            match.save()

        return Response(
            {
                "message": "Claim approved successfully.",
                "claim_id": claim.id,
                "status": claim.status,
                "match_status": match.status if match else None,
            },
            status=status.HTTP_200_OK
        )
    
class RejectClaimView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, claim_id):

        if not request.user.is_superuser:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            claim = Claim.objects.get(id=claim_id)
        except Claim.DoesNotExist:
            return Response(
                {"error": "Claim not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if claim.status != "pending":
            return Response(
                {"error": "Only pending claims can be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        rejection_reason = request.data.get("rejection_reason")

        if not rejection_reason:
            return Response(
                {"error": "Rejection reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        claim.status = "rejected"
        claim.rejection_reason = rejection_reason
        claim.reviewed_at = timezone.now()
        claim.save()

        Notification.objects.create(
            recipient=claim.claimant,
            title="Claim Rejected",
            message=(
                f"Your claim #{claim.id} was rejected. "
                f"Reason: {rejection_reason}"
            ),
            notification_type="claim_rejected",
            related_url="/claims/page/my/",
        )

        return Response(
            {
                "message": "Claim rejected successfully.",
                "claim_id": claim.id,
                "status": claim.status,
                "rejection_reason": claim.rejection_reason,
            },
            status=status.HTTP_200_OK
        )