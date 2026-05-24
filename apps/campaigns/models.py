from django.db import models

from core.models import TenantSoftDeleteModel


class Campaign(TenantSoftDeleteModel):
    """Marketing campaign managed by a client."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Stage(models.TextChoices):
        INITIATION = "initiation", "Initiation"
        REQUIREMENT_DISCUSSION = "requirement_discussion", "Requirement Discussion"
        CREATOR_DISCOVERY = "creator_discovery", "Creator Discovery"
        CREATOR_SELECTION = "creator_selection", "Creator Selection & Confirmation"
        AGREEMENT = "agreement", "Agreement"
        CONTENT_CREATION = "content_creation", "Content Creation"
        REVIEW_APPROVAL = "review_approval", "Review & Approval"
        PUBLISHING = "publishing", "Publishing"
        PERFORMANCE_TRACKING = "performance_tracking", "Performance Tracking"
        PAYOUT_PROCESSING = "payout_processing", "Payout Processing"
        CAMPAIGN_CLOSE = "campaign_close", "Campaign Close"

    STAGE_ORDER = [s.value for s in Stage]

    brand = models.ForeignKey(
        "brands.Brand", on_delete=models.CASCADE, related_name="campaigns"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    objective = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    target_audience = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    current_stage = models.CharField(max_length=30, choices=Stage.choices, default=Stage.INITIATION)
    created_by = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_campaigns",
    )

    class Meta:
        db_table = "campaign"

    def __str__(self):
        return self.title

    def can_transition_to(self, new_stage):
        """Validate that the stage transition is forward-only."""
        try:
            current_idx = self.STAGE_ORDER.index(self.current_stage)
            new_idx = self.STAGE_ORDER.index(new_stage)
            return new_idx == current_idx + 1
        except ValueError:
            return False

    def transition_to(self, new_stage, changed_by, notes=""):
        """Move campaign to the next stage with audit log."""
        if not self.can_transition_to(new_stage):
            raise ValueError(
                f"Cannot transition from {self.current_stage} to {new_stage}"
            )
        old_stage = self.current_stage
        self.current_stage = new_stage
        if new_stage == self.Stage.CAMPAIGN_CLOSE:
            self.status = self.Status.COMPLETED
        elif self.status == self.Status.DRAFT:
            self.status = self.Status.ACTIVE
        self.save(update_fields=["current_stage", "status", "updated_at"])
        CampaignStatusLog.objects.create(
            campaign=self,
            from_stage=old_stage,
            to_stage=new_stage,
            changed_by=changed_by,
            notes=notes,
        )


class CampaignCreator(models.Model):
    """Creator assigned to a campaign."""

    class Status(models.TextChoices):
        SHORTLISTED = "shortlisted", "Shortlisted"
        CONFIRMED = "confirmed", "Confirmed"
        REJECTED = "rejected", "Rejected"
        COMPLETED = "completed", "Completed"

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="campaign_creators")
    creator = models.ForeignKey("creators.Creator", on_delete=models.CASCADE, related_name="campaign_assignments")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SHORTLISTED)
    assigned_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "campaign_creator"
        unique_together = [("campaign", "creator")]

    def __str__(self):
        return f"{self.campaign.title} - {self.creator.name}"


class CampaignRequirement(models.Model):
    """Content requirements for a campaign."""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="requirements")
    ad_format = models.ForeignKey(
        "configurations.AdFormat", on_delete=models.SET_NULL, null=True, related_name="campaign_requirements"
    )
    platform = models.ForeignKey(
        "configurations.Platform", on_delete=models.SET_NULL, null=True, related_name="campaign_requirements"
    )
    quantity = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)
    deadline = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "campaign_requirement"

    def __str__(self):
        return f"{self.campaign.title} - {self.ad_format} on {self.platform}"


class CampaignContent(models.Model):
    """Content piece produced for a campaign by a creator."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        PUBLISHED = "published", "Published"

    class ApprovalStage(models.TextChoices):
        PENDING_AGENCY = "pending_agency", "Pending Agency Review"
        AGENCY_APPROVED = "agency_approved", "Agency Approved"
        PENDING_BRAND = "pending_brand", "Pending Brand Review"
        BRAND_APPROVED = "brand_approved", "Brand Approved"
        FINAL_APPROVED = "final_approved", "Final Approved"

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="contents")
    campaign_creator = models.ForeignKey(
        CampaignCreator, on_delete=models.CASCADE, related_name="contents"
    )
    requirement = models.ForeignKey(
        CampaignRequirement, on_delete=models.SET_NULL, null=True, blank=True, related_name="contents"
    )
    content_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    # Content approval workflow
    current_version = models.PositiveIntegerField(default=0)
    approval_stage = models.CharField(
        max_length=20, choices=ApprovalStage.choices, default=ApprovalStage.PENDING_AGENCY
    )
    approved_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    brand_feedback = models.TextField(blank=True)

    class Meta:
        db_table = "campaign_content"

    def __str__(self):
        return f"Content #{self.pk} - {self.campaign.title}"


class CampaignMetric(models.Model):
    """Performance metric for a content piece."""

    class MetricType(models.TextChoices):
        VIEWS = "views", "Views"
        LIKES = "likes", "Likes"
        SHARES = "shares", "Shares"
        COMMENTS = "comments", "Comments"
        REACH = "reach", "Reach"
        CLICKS = "clicks", "Clicks"
        CONVERSIONS = "conversions", "Conversions"

    campaign_content = models.ForeignKey(
        CampaignContent, on_delete=models.CASCADE, related_name="metrics"
    )
    metric_type = models.CharField(max_length=20, choices=MetricType.choices)
    value = models.BigIntegerField(default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "campaign_metric"

    def __str__(self):
        return f"{self.campaign_content} - {self.metric_type}: {self.value}"


class CampaignStatusLog(models.Model):
    """Audit trail of campaign stage transitions."""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="status_logs")
    from_stage = models.CharField(max_length=30)
    to_stage = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "campaign_status_log"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.campaign.title}: {self.from_stage} → {self.to_stage}"


# ── Brief & Deliverables ──────────────────────────────────────

class BriefTemplate(TenantSoftDeleteModel):
    """Reusable brief template for campaigns."""
    name = models.CharField(max_length=200)
    content = models.JSONField(default=dict, blank=True, help_text="Template structure as JSON")
    category = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        db_table = "brief_template"

    def __str__(self):
        return self.name


class CampaignBrief(TenantSoftDeleteModel):
    """Campaign brief with all project details."""
    campaign = models.OneToOneField(Campaign, on_delete=models.CASCADE, related_name="brief")
    template = models.ForeignKey(
        BriefTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    overview = models.TextField(blank=True)
    goals = models.TextField(blank=True)
    target_audience = models.TextField(blank=True)
    key_messages = models.TextField(blank=True)
    dos = models.TextField(blank=True, help_text="Things creators should do")
    donts = models.TextField(blank=True, help_text="Things creators should avoid")
    references = models.JSONField(default=list, blank=True, help_text="Reference URLs/files")
    hashtags = models.JSONField(default=list, blank=True)
    mentions = models.JSONField(default=list, blank=True)
    submission_deadline = models.DateTimeField(null=True, blank=True)
    publish_deadline = models.DateTimeField(null=True, blank=True)
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "campaign_brief"

    def __str__(self):
        return f"Brief: {self.campaign.title}"


class DeliverableChecklist(models.Model):
    """Individual deliverable item for a campaign."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        REVISION_NEEDED = "revision_needed", "Revision Needed"

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="deliverables")
    campaign_creator = models.ForeignKey(
        CampaignCreator, on_delete=models.CASCADE, related_name="deliverables", null=True, blank=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    platform = models.ForeignKey(
        "configurations.Platform", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    ad_format = models.ForeignKey(
        "configurations.AdFormat", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    due_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "deliverable_checklist"
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.title} ({self.campaign.title})"


# ── Content Review ─────────────────────────────────────────────

class ContentRevision(models.Model):
    """Version history for a content piece."""
    content = models.ForeignKey(CampaignContent, on_delete=models.CASCADE, related_name="revisions")
    version = models.PositiveIntegerField()
    file_url = models.URLField(blank=True)
    file = models.FileField(upload_to="campaigns/revisions/", blank=True)
    caption = models.TextField(blank=True)
    submitted_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "content_revision"
        unique_together = [("content", "version")]
        ordering = ["-version"]

    def __str__(self):
        return f"v{self.version} - Content #{self.content_id}"


class ContentComment(models.Model):
    """Review comment on content during approval."""
    content = models.ForeignKey(CampaignContent, on_delete=models.CASCADE, related_name="comments")
    revision = models.ForeignKey(
        ContentRevision, on_delete=models.SET_NULL, null=True, blank=True, related_name="comments"
    )
    author = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="+")
    text = models.TextField()
    timestamp_marker = models.DurationField(null=True, blank=True, help_text="Timestamp in video for comment")
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "content_comment"
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on Content #{self.content_id}"


# ── Campaign Expenses ─────────────────────────────────────────

class ExpenseCategory(TenantSoftDeleteModel):
    """Category for campaign expenses (travel, production, etc.)."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "expense_category"
        unique_together = [("client", "name")]

    def __str__(self):
        return self.name


class CampaignExpense(TenantSoftDeleteModel):
    """Expense line item for a campaign."""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="expenses")
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, related_name="+")
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    expense_date = models.DateField()
    receipt = models.FileField(upload_to="campaigns/receipts/", blank=True)
    paid_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    approved_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    is_billable = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "campaign_expense"

    def __str__(self):
        return f"{self.description}: {self.amount} ({self.campaign.title})"


# ── Campaign Templates & Cloning ──────────────────────────────

class CampaignTemplate(TenantSoftDeleteModel):
    """Template to quickly clone new campaigns."""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    default_budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    default_duration_days = models.PositiveIntegerField(null=True, blank=True)
    target_audience = models.JSONField(default=dict, blank=True)
    requirements_template = models.JSONField(default=list, blank=True, help_text="List of requirement dicts")
    brief_template = models.ForeignKey(
        BriefTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_by = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        db_table = "campaign_template"

    def __str__(self):
        return self.name


# ── Creator-Brand Relationships ───────────────────────────────

class CreatorAvailability(models.Model):
    """Blocked/busy dates for a creator."""
    creator = models.ForeignKey("creators.Creator", on_delete=models.CASCADE, related_name="availability_blocks")
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "creator_availability"

    def __str__(self):
        return f"{self.creator.name}: {self.start_date} - {self.end_date}"


class BrandExclusivity(TenantSoftDeleteModel):
    """Exclusivity contract between a brand and creator."""
    brand = models.ForeignKey("brands.Brand", on_delete=models.CASCADE, related_name="exclusivities")
    creator = models.ForeignKey("creators.Creator", on_delete=models.CASCADE, related_name="exclusivities")
    category = models.CharField(max_length=200, blank=True, help_text="Product category for exclusivity")
    start_date = models.DateField()
    end_date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "brand_exclusivity"

    def __str__(self):
        return f"{self.creator.name} exclusive to {self.brand.name}"


class CreatorBrandPreference(TenantSoftDeleteModel):
    """Track creator-brand relationship preferences (preferred, blacklisted, etc.)."""

    class PreferenceType(models.TextChoices):
        PREFERRED = "preferred", "Preferred"
        NEUTRAL = "neutral", "Neutral"
        BLACKLISTED = "blacklisted", "Blacklisted"

    creator = models.ForeignKey("creators.Creator", on_delete=models.CASCADE, related_name="brand_preferences")
    brand = models.ForeignKey("brands.Brand", on_delete=models.CASCADE, related_name="creator_preferences")
    preference = models.CharField(max_length=20, choices=PreferenceType.choices, default=PreferenceType.NEUTRAL)
    reason = models.TextField(blank=True)
    campaigns_together = models.PositiveIntegerField(default=0)
    last_collaboration = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "creator_brand_preference"
        unique_together = [("creator", "brand")]

    def __str__(self):
        return f"{self.creator.name} → {self.brand.name}: {self.preference}"


# ── Campaign Calendar & Deadlines ─────────────────────────────

class CampaignDeadline(models.Model):
    """Specific deadline/milestone in a campaign timeline."""

    class DeadlineType(models.TextChoices):
        CONTENT_SUBMISSION = "content_submission", "Content Submission"
        REVIEW_DEADLINE = "review_deadline", "Review Deadline"
        PUBLISH_DATE = "publish_date", "Publish Date"
        PAYMENT_DUE = "payment_due", "Payment Due"
        CUSTOM = "custom", "Custom"

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="deadlines")
    title = models.CharField(max_length=255)
    deadline_type = models.CharField(max_length=30, choices=DeadlineType.choices, default=DeadlineType.CUSTOM)
    due_date = models.DateTimeField()
    assigned_to = models.ForeignKey(
        "employees.Employee", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    campaign_creator = models.ForeignKey(
        CampaignCreator, on_delete=models.SET_NULL, null=True, blank=True, related_name="deadlines"
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "campaign_deadline"
        ordering = ["due_date"]

    def __str__(self):
        return f"{self.title} - {self.due_date} ({self.campaign.title})"
