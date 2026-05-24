from django.db import models

from core.models import TenantSoftDeleteModel


class Comment(TenantSoftDeleteModel):
    """Activity note/comment attached to any entity (campaign, creator, brand, payout)."""

    class EntityType(models.TextChoices):
        CAMPAIGN = "campaign", "Campaign"
        CREATOR = "creator", "Creator"
        BRAND = "brand", "Brand"
        PAYOUT = "payout", "Payout"

    class Context(models.TextChoices):
        NOTE = "note", "Note"
        BRAND_SAID = "brand_said", "Brand Said"
        CREATOR_SAID = "creator_said", "Creator Said"
        AGENCY_PITCH = "agency_pitch", "Agency Pitch"

    entity_type = models.CharField(max_length=20, choices=EntityType.choices)
    entity_id = models.PositiveIntegerField()
    author = models.ForeignKey(
        "employees.Employee", on_delete=models.CASCADE, related_name="comments"
    )
    text = models.TextField()
    context = models.CharField(max_length=20, choices=Context.choices, default=Context.NOTE)
    is_internal = models.BooleanField(default=True)
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="replies"
    )
    attachments = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "comment"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
        ]

    def __str__(self):
        return f"{self.author} on {self.entity_type}:{self.entity_id}"
