from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Report, ReportImage, Match
from .serializers import ReportSerializer
from .matching import (
    create_matches_for_found_report,
    create_matches_for_lost_report,
)



class CreateReportView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ReportSerializer(
            data=request.data
        )

        if serializer.is_valid():

            report = serializer.save(
                user=request.user,
                status=serializer.validated_data["type"]
            )

            private_details = request.data.get(
                "private_identification_details"
            )

            if private_details:
                report.private_identification_details = (
                    private_details
                )
                report.save(
                    update_fields=[
                        "private_identification_details",
                        "updated_at",
                    ]
                )

            photo = request.FILES.get("photo")

            if photo:
                ReportImage.objects.create(
                    report=report,
                    image_url=photo,
                    image_type="found_item"
                )

            if report.type == "found":
                create_matches_for_found_report(report)

            elif report.type == "lost":
                create_matches_for_lost_report(report)

            return Response(
                ReportSerializer(report).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
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

class MyMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        matches = Match.objects.filter(
            lost_report__user=request.user
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