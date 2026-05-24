from rest_framework import serializers

from apps.reports.models import SavedReport


class SavedReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(
        source="generated_by.full_name", read_only=True, default=""
    )

    class Meta:
        model = SavedReport
        fields = [
            "id", "name", "report_type", "filters", "export_format",
            "file_url", "status", "generated_by", "generated_by_name",
            "generated_at", "created_at",
        ]
        read_only_fields = ["id", "status", "file_url", "generated_at", "created_at"]
