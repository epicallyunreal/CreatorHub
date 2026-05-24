from django.db import models

from core.models import TenantSoftDeleteModel


class PayoutType(TenantSoftDeleteModel):
    """Client-configurable payout type template."""

    class TypeCode(models.TextChoices):
        ADVANCE = "advance", "Advance"
        GOAL_BASED = "goal_based", "Goal-Based"
        ONE_TIME = "one_time", "One-Time"
        COMPLETION = "completion", "Completion Only"
        HYBRID = "hybrid", "Hybrid"

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    type_code = models.CharField(max_length=20, choices=TypeCode.choices)

    class Meta:
        db_table = "payout_type"
        unique_together = [("client", "type_code")]

    def __str__(self):
        return self.name


class PayoutConfig(models.Model):
    """Payout configuration for a campaign-creator assignment."""
    campaign_creator = models.ForeignKey(
        "campaigns.CampaignCreator",
        on_delete=models.CASCADE,
        related_name="payout_configs",
    )
    payout_type = models.ForeignKey(PayoutType, on_delete=models.PROTECT, related_name="payout_configs")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    terms = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payout_config"

    def __str__(self):
        return f"{self.campaign_creator} - {self.payout_type}: {self.total_amount}"


class PayoutMilestone(models.Model):
    """Goal-based/hybrid milestones within a payout config."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACHIEVED = "achieved", "Achieved"
        PAID = "paid", "Paid"

    payout_config = models.ForeignKey(PayoutConfig, on_delete=models.CASCADE, related_name="milestones")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    trigger_condition = models.TextField(blank=True, help_text="Condition to achieve this milestone")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    achieved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "payout_milestone"

    def __str__(self):
        return f"{self.name} ({self.status})"


class Payout(models.Model):
    """Individual payout request/transaction."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        PROCESSING = "processing", "Processing"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"

    payout_config = models.ForeignKey(PayoutConfig, on_delete=models.CASCADE, related_name="payouts")
    milestone = models.ForeignKey(
        PayoutMilestone, on_delete=models.SET_NULL, null=True, blank=True, related_name="payouts"
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    requested_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, related_name="requested_payouts"
    )
    approved_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_payouts"
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    # Tax fields
    tds_section = models.CharField(max_length=10, blank=True, help_text="TDS section e.g. 194R, 194J, 194C")
    tds_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tds_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_applicable = models.BooleanField(default=False)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Payment details
    payment_mode = models.CharField(
        max_length=10,
        choices=[("neft", "NEFT"), ("imps", "IMPS"), ("upi", "UPI"), ("cheque", "Cheque"), ("cash", "Cash")],
        blank=True,
    )
    utr_number = models.CharField(max_length=50, blank=True, help_text="Bank transaction reference")
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "payout"
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Payout #{self.pk} - {self.amount} ({self.status})"


class Invoice(models.Model):
    """Auto-generated invoice for a payout."""
    payout = models.OneToOneField(Payout, on_delete=models.CASCADE, related_name="invoice")
    invoice_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2)
    generated_at = models.DateTimeField(auto_now_add=True)
    pdf_url = models.URLField(blank=True)
    # GST fields
    gstin = models.CharField(max_length=15, blank=True, help_text="GSTIN of the creator")
    cgst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    place_of_supply = models.CharField(max_length=50, blank=True)
    hsn_sac_code = models.CharField(max_length=10, blank=True)
    # TDS
    tds_deducted = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tds_certificate_url = models.URLField(blank=True)

    class Meta:
        db_table = "invoice"

    def __str__(self):
        return self.invoice_number
