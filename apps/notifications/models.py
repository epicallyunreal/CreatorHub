from django.db import models

from core.models import TenantSoftDeleteModel


class Notification(models.Model):
    """In-app notification for an employee."""

    class Channel(models.TextChoices):
        IN_APP = "in_app", "In-App"
        EMAIL = "email", "Email"
        SMS = "sms", "SMS"
        WHATSAPP = "whatsapp", "WhatsApp"

    employee = models.ForeignKey(
        "employees.Employee", on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50)
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.IN_APP)
    entity_type = models.CharField(max_length=100, blank=True)
    entity_id = models.BigIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} → {self.employee}"


class NotificationPreference(models.Model):
    """Per-employee notification preferences per event type."""
    employee = models.ForeignKey(
        "employees.Employee", on_delete=models.CASCADE, related_name="notification_preferences"
    )
    event_type = models.CharField(max_length=50)
    email = models.BooleanField(default=True)
    in_app = models.BooleanField(default=True)
    sms = models.BooleanField(default=False)
    whatsapp = models.BooleanField(default=False)

    class Meta:
        db_table = "notification_preference"
        unique_together = [("employee", "event_type")]

    def __str__(self):
        return f"{self.employee} - {self.event_type}"


class NotificationTemplate(TenantSoftDeleteModel):
    """Reusable notification templates for auto-triggered notifications."""

    class TriggerEvent(models.TextChoices):
        CAMPAIGN_CREATED = "campaign_created", "Campaign Created"
        CAMPAIGN_STAGE_CHANGED = "campaign_stage_changed", "Campaign Stage Changed"
        CONTENT_SUBMITTED = "content_submitted", "Content Submitted"
        CONTENT_APPROVED = "content_approved", "Content Approved"
        CONTENT_REJECTED = "content_rejected", "Content Rejected"
        PAYOUT_REQUESTED = "payout_requested", "Payout Requested"
        PAYOUT_APPROVED = "payout_approved", "Payout Approved"
        PAYOUT_PAID = "payout_paid", "Payout Paid"
        DEADLINE_APPROACHING = "deadline_approaching", "Deadline Approaching"
        CREATOR_ASSIGNED = "creator_assigned", "Creator Assigned"

    trigger_event = models.CharField(max_length=30, choices=TriggerEvent.choices)
    name = models.CharField(max_length=200)
    title_template = models.CharField(max_length=255, help_text="Supports {campaign}, {creator}, etc.")
    body_template = models.TextField(help_text="Supports {campaign}, {creator}, {brand}, etc.")
    channels = models.JSONField(default=list, blank=True, help_text='e.g. ["in_app","email"]')
    is_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = "notification_template"
        unique_together = [("client", "trigger_event")]

    def __str__(self):
        return f"{self.name} ({self.trigger_event})"
