from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):

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
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
        ]