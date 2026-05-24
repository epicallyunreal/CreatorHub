from django.db import models

from core.models import TenantSoftDeleteModel


class SavedReport(TenantSoftDeleteModel):
    """Saved/exported report record."""

    class ReportType(models.TextChoices):
        CAMPAIGN = "campaign", "Campaign Report"
        CREATOR = "creator", "Creator Report"
        BRAND = "brand", "Brand Report"
        FINANCIAL = "financial", "Financial Report"
        DASHBOARD = "dashboard", "Dashboard Snapshot"

    class ExportFormat(models.TextChoices):
        PDF = "pdf", "PDF"
        CSV = "csv", "CSV"
        EXCEL = "excel", "Excel"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    filters = models.JSONField(default=dict, blank=True, help_text="Filter parameters used")
    export_format = models.CharField(max_length=10, choices=ExportFormat.choices, blank=True)
    file_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default="pending")
    generated_by = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        related_name="generated_reports",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_report"
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.name} ({self.report_type})"
