from django.db import models

from core.models import TenantSoftDeleteModel


class Creator(TenantSoftDeleteModel):
    """Influencer/content creator managed by a client."""
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=[("male", "Male"), ("female", "Female"), ("non_binary", "Non-Binary"), ("other", "Other")],
        blank=True,
    )
    language = models.JSONField(default=list, blank=True, help_text="List of languages")
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to="creators/profiles/", blank=True, null=True)
    created_by = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_creators",
    )
    # KYC & Bank Details
    pan_number = models.CharField(max_length=10, blank=True)
    gst_number = models.CharField(max_length=15, blank=True)
    aadhaar_number = models.CharField(max_length=12, blank=True)
    bank_account_name = models.CharField(max_length=150, blank=True)
    bank_account_number = models.CharField(max_length=20, blank=True)
    bank_ifsc = models.CharField(max_length=11, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=6, blank=True)
    upi_id = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "creator"
        unique_together = [("client", "email")]

    def __str__(self):
        return self.name


class CreatorPlatform(models.Model):
    """Creator's presence on a specific platform."""
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="platforms")
    platform = models.ForeignKey("configurations.Platform", on_delete=models.CASCADE, related_name="creator_platforms")
    handle = models.CharField(max_length=255)
    follower_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    profile_url = models.URLField(blank=True)
    is_primary = models.BooleanField(default=False)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "creator_platform"
        unique_together = [("creator", "platform")]

    def __str__(self):
        return f"{self.creator.name} @ {self.platform.name}"


class CreatorDomain(models.Model):
    """Creator's content domain/niche."""
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="domains")
    domain = models.ForeignKey("configurations.Domain", on_delete=models.CASCADE, related_name="creator_domains")
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = "creator_domain"
        unique_together = [("creator", "domain")]

    def __str__(self):
        return f"{self.creator.name} - {self.domain.name}"


class CreatorCharge(models.Model):
    """Creator's charge per platform × ad format."""
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="charges")
    platform = models.ForeignKey("configurations.Platform", on_delete=models.CASCADE, related_name="creator_charges")
    ad_format = models.ForeignKey("configurations.AdFormat", on_delete=models.CASCADE, related_name="creator_charges")
    charge_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    is_negotiable = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "creator_charge"
        unique_together = [("creator", "platform", "ad_format")]

    def __str__(self):
        return f"{self.creator.name} - {self.platform.name}/{self.ad_format.name}: {self.charge_amount}"


class CreatorFollowerHistory(models.Model):
    """Periodic follower snapshot for growth tracking."""
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="follower_history")
    platform = models.ForeignKey("configurations.Platform", on_delete=models.CASCADE, related_name="follower_histories")
    follower_count = models.PositiveIntegerField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "creator_follower_history"
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"{self.creator.name}/{self.platform.name}: {self.follower_count} @ {self.recorded_at}"


class CreatorDocument(TenantSoftDeleteModel):
    """Document uploaded for a creator (PAN, Aadhaar, NDA, etc.)."""

    class DocumentType(models.TextChoices):
        PAN_CARD = "pan_card", "PAN Card"
        AADHAAR = "aadhaar", "Aadhaar"
        GST_CERTIFICATE = "gst_certificate", "GST Certificate"
        BANK_PROOF = "bank_proof", "Bank Proof"
        NDA = "nda", "NDA"
        CONTRACT = "contract", "Contract"
        PORTFOLIO = "portfolio", "Portfolio"
        OTHER = "other", "Other"

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"

    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    name = models.CharField(max_length=200)
    file = models.FileField(upload_to="creators/documents/")
    expiry_date = models.DateField(null=True, blank=True)
    verified_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = "creator_document"

    def __str__(self):
        return f"{self.creator.name} - {self.document_type}: {self.name}"


class MediaKitConfig(TenantSoftDeleteModel):
    """Media kit configuration for a creator's public portfolio page."""
    creator = models.OneToOneField(Creator, on_delete=models.CASCADE, related_name="media_kit")
    tagline = models.CharField(max_length=255, blank=True)
    about = models.TextField(blank=True)
    highlight_stats = models.JSONField(default=dict, blank=True, help_text="Key stats to highlight")
    theme_color = models.CharField(max_length=7, default="#6366f1")
    show_contact = models.BooleanField(default=False)
    show_charges = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    custom_url_slug = models.SlugField(max_length=100, blank=True, unique=True, null=True)

    class Meta:
        db_table = "media_kit_config"

    def __str__(self):
        return f"Media Kit: {self.creator.name}"


class MediaKitLink(models.Model):
    """External link in a creator's media kit (portfolio, case studies, etc.)."""
    media_kit = models.ForeignKey(MediaKitConfig, on_delete=models.CASCADE, related_name="links")
    title = models.CharField(max_length=200)
    url = models.URLField()
    link_type = models.CharField(
        max_length=20,
        choices=[("portfolio", "Portfolio"), ("case_study", "Case Study"), ("press", "Press"), ("other", "Other")],
        default="other",
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "media_kit_link"
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.title} ({self.media_kit.creator.name})"
