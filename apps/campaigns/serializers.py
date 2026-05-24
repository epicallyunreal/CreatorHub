from rest_framework import serializers

from apps.campaigns.models import (
    BrandExclusivity,
    BriefTemplate,
    Campaign,
    CampaignBrief,
    CampaignContent,
    CampaignCreator,
    CampaignDeadline,
    CampaignExpense,
    CampaignMetric,
    CampaignRequirement,
    CampaignStatusLog,
    CampaignTemplate,
    ContentComment,
    ContentRevision,
    CreatorAvailability,
    CreatorBrandPreference,
    DeliverableChecklist,
    ExpenseCategory,
)


class CampaignStatusLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.full_name", read_only=True)

    class Meta:
        model = CampaignStatusLog
        fields = ["id", "from_stage", "to_stage", "changed_by", "changed_by_name", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class CampaignRequirementSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.name", read_only=True)
    ad_format_name = serializers.CharField(source="ad_format.name", read_only=True)

    class Meta:
        model = CampaignRequirement
        fields = [
            "id", "ad_format", "ad_format_name", "platform", "platform_name",
            "quantity", "description", "deadline",
        ]
        read_only_fields = ["id"]


class CampaignMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignMetric
        fields = ["id", "campaign_content", "metric_type", "value", "recorded_at"]
        read_only_fields = ["id", "recorded_at"]


class CampaignContentSerializer(serializers.ModelSerializer):
    metrics = CampaignMetricSerializer(many=True, read_only=True)

    class Meta:
        model = CampaignContent
        fields = [
            "id", "campaign", "campaign_creator", "requirement", "content_url",
            "status", "submitted_at", "approved_at", "published_at",
            "rejection_reason", "current_version", "approval_stage",
            "approved_by", "brand_feedback", "metrics",
        ]
        read_only_fields = ["id"]


class CampaignCreatorSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source="creator.name", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.full_name", read_only=True)
    contents = CampaignContentSerializer(many=True, read_only=True)

    class Meta:
        model = CampaignCreator
        fields = [
            "id", "campaign", "creator", "creator_name", "status",
            "assigned_by", "assigned_by_name", "assigned_at", "confirmed_at",
            "notes", "contents",
        ]
        read_only_fields = ["id", "assigned_at"]


class CampaignListSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    creator_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id", "brand", "brand_name", "title", "status", "current_stage",
            "budget", "start_date", "end_date", "is_active", "creator_count",
            "created_at",
        ]


class CampaignDetailSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    campaign_creators = CampaignCreatorSerializer(many=True, read_only=True)
    requirements = CampaignRequirementSerializer(many=True, read_only=True)
    status_logs = CampaignStatusLogSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id", "brand", "brand_name", "title", "description", "objective",
            "budget", "start_date", "end_date", "target_audience", "status",
            "current_stage", "is_active", "created_by", "created_by_name",
            "campaign_creators", "requirements", "status_logs",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "status", "current_stage", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        validated_data["created_by"] = getattr(request, "employee", None)
        return super().create(validated_data)


class CampaignTransitionSerializer(serializers.Serializer):
    to_stage = serializers.ChoiceField(choices=Campaign.Stage.choices)
    notes = serializers.CharField(required=False, default="")


# ── Brief & Deliverables ──────────────────────────────────────

class BriefTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BriefTemplate
        fields = [
            "id", "name", "content", "category", "created_by",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        validated_data["created_by"] = getattr(request, "employee", None)
        return super().create(validated_data)


class CampaignBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignBrief
        fields = [
            "id", "campaign", "template", "overview", "goals",
            "target_audience", "key_messages", "dos", "donts",
            "references", "hashtags", "mentions",
            "submission_deadline", "publish_deadline",
            "approved", "approved_by", "approved_at",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "approved_by", "approved_at", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class DeliverableChecklistSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.name", read_only=True)
    ad_format_name = serializers.CharField(source="ad_format.name", read_only=True)

    class Meta:
        model = DeliverableChecklist
        fields = [
            "id", "campaign", "campaign_creator", "title", "description",
            "platform", "platform_name", "ad_format", "ad_format_name",
            "due_date", "status", "sort_order",
        ]
        read_only_fields = ["id"]


# ── Content Review ─────────────────────────────────────────────

class ContentRevisionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source="submitted_by.full_name", read_only=True)

    class Meta:
        model = ContentRevision
        fields = [
            "id", "content", "version", "file_url", "file", "caption",
            "submitted_by", "submitted_by_name", "submitted_at", "notes",
        ]
        read_only_fields = ["id", "submitted_by", "submitted_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["submitted_by"] = getattr(request, "employee", None)
        return super().create(validated_data)


class ContentCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = ContentComment
        fields = [
            "id", "content", "revision", "author", "author_name", "text",
            "timestamp_marker", "is_resolved", "created_at",
        ]
        read_only_fields = ["id", "author", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["author"] = request.employee
        return super().create(validated_data)


# ── Campaign Expenses ─────────────────────────────────────────

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class CampaignExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = CampaignExpense
        fields = [
            "id", "campaign", "category", "category_name", "description",
            "amount", "currency", "expense_date", "receipt", "paid_by",
            "approved_by", "is_billable", "notes",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


# ── Campaign Templates ────────────────────────────────────────

class CampaignTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignTemplate
        fields = [
            "id", "name", "description", "default_budget",
            "default_duration_days", "target_audience",
            "requirements_template", "brief_template",
            "created_by", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        validated_data["created_by"] = getattr(request, "employee", None)
        return super().create(validated_data)


# ── Creator-Brand Relationships ───────────────────────────────

class CreatorAvailabilitySerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source="creator.name", read_only=True)

    class Meta:
        model = CreatorAvailability
        fields = ["id", "creator", "creator_name", "start_date", "end_date", "reason"]
        read_only_fields = ["id"]


class BrandExclusivitySerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    creator_name = serializers.CharField(source="creator.name", read_only=True)

    class Meta:
        model = BrandExclusivity
        fields = [
            "id", "brand", "brand_name", "creator", "creator_name",
            "category", "start_date", "end_date", "notes",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class CreatorBrandPreferenceSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source="creator.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)

    class Meta:
        model = CreatorBrandPreference
        fields = [
            "id", "creator", "creator_name", "brand", "brand_name",
            "preference", "reason", "campaigns_together", "last_collaboration",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


# ── Campaign Calendar & Deadlines ─────────────────────────────

class CampaignDeadlineSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)

    class Meta:
        model = CampaignDeadline
        fields = [
            "id", "campaign", "title", "deadline_type", "due_date",
            "assigned_to", "assigned_to_name", "campaign_creator",
            "is_completed", "completed_at", "notes",
        ]
        read_only_fields = ["id"]
