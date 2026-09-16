from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Claim, ClaimEvidence,ClaimVerification
from reports.models import Report, Match
from django.utils import timezone

class CreateClaimView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        report_id = request.data.get("report_id")
        unique_details = request.data.get(
            "unique_identification_details"
        )
        description = request.data.get("description")


        if not report_id:
            return Response(
                {"error": "Report ID is required."},
                status=status.HTTP_400_BAD_REQUEST
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
        match = Match.objects.filter(
            lost_report=lost_report
        ).select_related(
            "found_report"
        ).order_by("-match_score").first()

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