from rest_framework import serializers

from .models import Report,ReportImage


class ReportImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ReportImage
        fields = [
            "id",
            "image_url",
            "image_type",
            "created_at",
        ]

class ReportSerializer(serializers.ModelSerializer):
    images = ReportImageSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Report

        fields = [
            "id",
            "item_name",
            "type",
            "category",
            "description",
            "brand",
            "color",
            "condition",
            "location",
            "event_date",
            "event_time",
            "reward_offered",
            "status",
            "created_at",
            "updated_at",
            "images",
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
        ]
