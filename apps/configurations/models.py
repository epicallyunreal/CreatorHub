from django.db import models

from core.models import SoftDeleteMixin, TenantSoftDeleteModel, TimeStampMixin


class Platform(SoftDeleteMixin, TimeStampMixin):
    """Platform definitions. Global (client=null) or client-specific."""
    client = models.ForeignKey(
        "accounts.Client", on_delete=models.CASCADE, null=True, blank=True,
        related_name="custom_platforms",
    )
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=255, blank=True)
    base_url = models.URLField(blank=True)

    class Meta:
        db_table = "platform"
        constraints = [
            models.UniqueConstraint(
                fields=["name"], condition=models.Q(client__isnull=True),
                name="unique_global_platform",
            ),
            models.UniqueConstraint(
                fields=["client", "name"],
                condition=models.Q(client__isnull=False),
                name="unique_client_platform",
            ),
        ]

    @property
    def is_global(self):
        return self.client_id is None

    def __str__(self):
        return self.name


class BusinessType(TenantSoftDeleteModel):
    """Brand business category (client-scoped)."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "business_type"
        unique_together = [("client", "name")]

    def __str__(self):
        return self.name


class Domain(TenantSoftDeleteModel):
    """Content domain / niche (client-scoped)."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "domain"
        unique_together = [("client", "name")]

    def __str__(self):
        return self.name


class AdFormat(SoftDeleteMixin, TimeStampMixin):
    """Ad format per platform (Reel, Short, Story, etc.). Global or client-specific."""
    client = models.ForeignKey(
        "accounts.Client", on_delete=models.CASCADE, null=True, blank=True,
        related_name="custom_ad_formats",
    )
    platform = models.ForeignKey(
        Platform, on_delete=models.CASCADE, related_name="ad_formats", null=True, blank=True
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "ad_format"
        constraints = [
            models.UniqueConstraint(
                fields=["name", "platform"], condition=models.Q(client__isnull=True),
                name="unique_global_ad_format",
            ),
            models.UniqueConstraint(
                fields=["client", "name", "platform"],
                condition=models.Q(client__isnull=False),
                name="unique_client_ad_format",
            ),
        ]

    @property
    def is_global(self):
        return self.client_id is None

    def __str__(self):
        return f"{self.name} ({self.platform})" if self.platform else self.name


class ApproximateCharge(TenantSoftDeleteModel):
    """Default charge range per platform × domain × ad format (client-scoped)."""
    platform = models.ForeignKey(Platform, on_delete=models.CASCADE, related_name="approx_charges")
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name="approx_charges")
    ad_format = models.ForeignKey(AdFormat, on_delete=models.CASCADE, related_name="approx_charges")
    min_charge = models.DecimalField(max_digits=12, decimal_places=2)
    max_charge = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")

    class Meta:
        db_table = "approximate_charge"
        unique_together = [("client", "platform", "domain", "ad_format")]

    def __str__(self):
        return f"{self.platform}/{self.domain}/{self.ad_format}: {self.min_charge}-{self.max_charge}"


class Tag(TenantSoftDeleteModel):
    """Generic tag for creators, brands, or campaigns."""

    class EntityType(models.TextChoices):
        CREATOR = "creator", "Creator"
        BRAND = "brand", "Brand"
        CAMPAIGN = "campaign", "Campaign"

    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#6366f1")
    entity_type = models.CharField(max_length=20, choices=EntityType.choices)

    class Meta:
        db_table = "tag"
        unique_together = [("client", "name", "entity_type")]

    def __str__(self):
        return f"{self.name} ({self.entity_type})"


class TagMapping(models.Model):
    """Maps a tag to a specific entity (creator, brand, or campaign)."""
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name="mappings")
    entity_type = models.CharField(max_length=20, choices=Tag.EntityType.choices)
    entity_id = models.PositiveIntegerField()

    class Meta:
        db_table = "tag_mapping"
        unique_together = [("tag", "entity_type", "entity_id")]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
        ]

    def __str__(self):
        return f"{self.tag.name} → {self.entity_type}:{self.entity_id}"
