from celery import shared_task

from apps.reports.models import SavedReport


@shared_task
def generate_report(report_id):
    """Generate and export a saved report (CSV / PDF / Excel)."""
    try:
        report = SavedReport.objects.get(pk=report_id)
    except SavedReport.DoesNotExist:
        return

    report.status = "processing"
    report.save(update_fields=["status"])

    try:
        # Placeholder — build the actual report content here.
        report.status = "completed"
        report.save(update_fields=["status"])
    except Exception:
        report.status = "failed"
        report.save(update_fields=["status"])
        raise
