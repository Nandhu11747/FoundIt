from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Report
from .serializers import ReportSerializer


class CreateReportView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ReportSerializer(
            data=request.data
        )

        if serializer.is_valid():

            report = serializer.save(
                user=request.user
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