from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Report, ReportImage, Match,ReportTag
from .serializers import ReportSerializer
from .matching import (
    create_matches_for_found_report,
    create_matches_for_lost_report,
)
from django.db.models import Exists, OuterRef
from claims.models import Claim



class CreateReportView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReportSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        report = serializer.save(
            user=request.user,
            status=serializer.validated_data["type"]
        )

        # Save tags
        tags = request.data.get("tags", [])

        if hasattr(request.data, "getlist"):
            tags = request.data.getlist("tags")

        if isinstance(tags, str):
            tags = [tags]

        if isinstance(tags, list):
            for tag in tags:
                if isinstance(tag, str) and tag.strip():
                    ReportTag.objects.create(
                        report=report,
                        tag=tag.strip()
                    )

        # Save private identification details
        private_details = request.data.get(
            "private_identification_details"
        )

        if private_details:
            report.private_identification_details = private_details
            report.save(
                update_fields=[
                    "private_identification_details",
                    "updated_at",
                ]
            )

        # Save uploaded photo
        photo = request.FILES.get("photo")

        if photo:
            ReportImage.objects.create(
                report=report,
                image_url=photo,
                image_type="found_item"
            )

        # Generate potential matches
        if report.type == "found":
            create_matches_for_found_report(report)
        elif report.type == "lost":
            create_matches_for_lost_report(report)

        return Response(
            ReportSerializer(report).data,
            status=status.HTTP_201_CREATED
        )


class MyReportsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        reports = Report.objects.filter(
            user=request.user
        ).order_by("-created_at")

        serializer = ReportSerializer(
            reports,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class BrowseItemsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = Report.objects.filter(
            type__in=["lost", "found"]
        ).exclude(
            user=request.user
        ).exclude(
            type="found",
            found_matches__status="confirmed"
        ).select_related(
            "user"
        ).prefetch_related(
            "images",
            "tags"
        ).order_by(
            "-created_at"
        ).distinct()

        data = []

        for report in reports:
            image = report.images.first()

            image_url = None
            if image:
                image_url = request.build_absolute_uri(
                    image.image_url.url
                )

            data.append({
                "id": report.id,
                "item_name": report.item_name,
                "type": report.type,
                "category": report.category,
                "description": report.description,
                "brand": report.brand,
                "color": report.color,
                "condition": report.condition,
                "location": report.location,
                "event_date": report.event_date,
                "created_at": report.created_at,
                "image_url": image_url,
                "tags": list(
                    report.tags.values_list("tag", flat=True)
                ),
                "submitted_by": (
                    (report.user.full_name or "").strip()
                    or getattr(report.user, "email", None)
                    or "Unknown user"
                ) if report.user else "Unknown user",
            })

        return Response(
            data,
            status=status.HTTP_200_OK
        )

class MyMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        active_claims = Claim.objects.filter(
            match_id=OuterRef("pk"),
            status__in=["pending", "approved"]
        )

        matches = Match.objects.filter(
            lost_report__user=request.user,
            status="pending"
        ).annotate(
            has_active_claim=Exists(active_claims)
        ).filter(
            has_active_claim=False
        ).select_related(
            "lost_report",
            "found_report"
        ).order_by("-match_score")

        data = []

        for match in matches:
            data.append({
                "id": match.id,
                "lost_report_id": match.lost_report.id,
                "found_report_id": match.found_report.id,
                "item_name": match.found_report.item_name,
                "category": match.found_report.category,
                "location": match.found_report.location,
                "event_date": match.found_report.event_date,
                "match_score": match.match_score,
                "status": match.status,
            })

        return Response(
            data,
            status=status.HTTP_200_OK
        )

class FoundReportMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        # Get the specific found report and only its matches
        matches = Match.objects.filter(
            found_report_id=report_id,
            lost_report__user=request.user
        ).select_related(
            "lost_report",
            "found_report"
        ).order_by("-match_score")

        data = []

        for match in matches:
            data.append({
                "match_id": match.id,
                "lost_report_id": match.lost_report.id,
                "lost_item_name": match.lost_report.item_name,
                "found_report_id": match.found_report.id,
                "found_item_name": match.found_report.item_name,
                "match_score": match.match_score,
                "match_status": match.status,
            })

        return Response(data, status=status.HTTP_200_OK)
