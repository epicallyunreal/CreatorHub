from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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
from apps.campaigns.serializers import (
    BrandExclusivitySerializer,
    BriefTemplateSerializer,
    CampaignBriefSerializer,
    CampaignContentSerializer,
    CampaignCreatorSerializer,
    CampaignDeadlineSerializer,
    CampaignDetailSerializer,
    CampaignExpenseSerializer,
    CampaignListSerializer,
    CampaignMetricSerializer,
    CampaignRequirementSerializer,
    CampaignStatusLogSerializer,
    CampaignTemplateSerializer,
    CampaignTransitionSerializer,
    ContentCommentSerializer,
    ContentRevisionSerializer,
    CreatorAvailabilitySerializer,
    CreatorBrandPreferenceSerializer,
    DeliverableChecklistSerializer,
    ExpenseCategorySerializer,
)
from core.drf_permissions import IsEmployee, RequirePermission
from core.mixins import AuditMixin
from core.permissions import has_permission


class CampaignViewSet(AuditMixin, viewsets.ModelViewSet):
    permission_classes = [IsEmployee, RequirePermission("campaigns")]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at", "start_date", "budget"]
    filterset_fields = ["status", "current_stage", "brand", "is_active"]

    def get_queryset(self):
        return (
            Campaign.objects.active()
            .filter(client=self.request.client)
            .select_related("brand", "created_by")
            .annotate(creator_count=Count("campaign_creators"))
        )

    def get_serializer_class(self):
        if self.action == "list":
            return CampaignListSerializer
        return CampaignDetailSerializer

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        campaign = self.get_object()
        employee = request.employee
        if not has_permission(employee, "campaigns.transition_stage"):
            return Response(
                {"detail": "Permission denied: campaigns.transition_stage required."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = CampaignTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            campaign.transition_to(
                serializer.validated_data["to_stage"],
                changed_by=employee,
                notes=serializer.validated_data.get("notes", ""),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CampaignDetailSerializer(campaign).data)

    @action(detail=True, methods=["get"], url_path="timeline")
    def timeline(self, request, pk=None):
        campaign = self.get_object()
        logs = campaign.status_logs.select_related("changed_by")
        return Response(CampaignStatusLogSerializer(logs, many=True).data)


class CampaignCreatorViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignCreatorSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return (
            CampaignCreator.objects.filter(
                campaign_id=self.kwargs["campaign_pk"],
                campaign__client=self.request.client,
            )
            .select_related("creator", "assigned_by")
            .prefetch_related("contents")
        )

    def perform_create(self, serializer):
        employee = self.request.employee
        if not has_permission(employee, "campaigns.assign_creator"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("campaigns.assign_creator permission required.")
        serializer.save(
            campaign_id=self.kwargs["campaign_pk"],
            assigned_by=employee,
        )


class CampaignRequirementViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignRequirementSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return CampaignRequirement.objects.filter(
            campaign_id=self.kwargs["campaign_pk"],
            campaign__client=self.request.client,
        ).select_related("ad_format", "platform")

    def perform_create(self, serializer):
        serializer.save(campaign_id=self.kwargs["campaign_pk"])


class CampaignContentViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignContentSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return CampaignContent.objects.filter(
            campaign_id=self.kwargs["campaign_pk"],
            campaign__client=self.request.client,
        ).prefetch_related("metrics")


class CampaignMetricViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignMetricSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return CampaignMetric.objects.filter(
            campaign_content__campaign_id=self.kwargs["campaign_pk"],
            campaign_content__campaign__client=self.request.client,
        )


# ── Brief & Deliverables ──────────────────────────────────────

class BriefTemplateViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = BriefTemplateSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return BriefTemplate.objects.active().filter(client=self.request.client)


class CampaignBriefViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignBriefSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return CampaignBrief.objects.active().filter(
            campaign_id=self.kwargs["campaign_pk"],
            campaign__client=self.request.client,
        )

    def perform_create(self, serializer):
        serializer.save(
            campaign_id=self.kwargs["campaign_pk"],
            client=self.request.client,
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, campaign_pk=None, pk=None):
        brief = self.get_object()
        from django.utils import timezone
        brief.approved = True
        brief.approved_by = request.employee
        brief.approved_at = timezone.now()
        brief.save(update_fields=["approved", "approved_by", "approved_at"])
        return Response(CampaignBriefSerializer(brief).data)


class DeliverableChecklistViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverableChecklistSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return DeliverableChecklist.objects.filter(
            campaign_id=self.kwargs["campaign_pk"],
            campaign__client=self.request.client,
        ).select_related("platform", "ad_format")

    def perform_create(self, serializer):
        serializer.save(campaign_id=self.kwargs["campaign_pk"])


# ── Content Review ─────────────────────────────────────────────

class ContentRevisionViewSet(viewsets.ModelViewSet):
    serializer_class = ContentRevisionSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return ContentRevision.objects.filter(
            content_id=self.kwargs["content_pk"],
            content__campaign__client=self.request.client,
        ).select_related("submitted_by")

    def perform_create(self, serializer):
        content = CampaignContent.objects.get(pk=self.kwargs["content_pk"])
        content.current_version += 1
        content.save(update_fields=["current_version"])
        serializer.save(
            content_id=self.kwargs["content_pk"],
            version=content.current_version,
            submitted_by=self.request.employee,
        )


class ContentCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ContentCommentSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return ContentComment.objects.filter(
            content_id=self.kwargs["content_pk"],
            content__campaign__client=self.request.client,
        ).select_related("author")


# ── Campaign Expenses ─────────────────────────────────────────

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsEmployee, RequirePermission("config")]

    def get_queryset(self):
        return ExpenseCategory.objects.active().filter(client=self.request.client)


class CampaignExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignExpenseSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return CampaignExpense.objects.active().filter(
            campaign_id=self.kwargs["campaign_pk"],
            campaign__client=self.request.client,
        ).select_related("category")

    def perform_create(self, serializer):
        serializer.save(
            campaign_id=self.kwargs["campaign_pk"],
            client=self.request.client,
        )


# ── Campaign Templates ────────────────────────────────────────

class CampaignTemplateViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = CampaignTemplateSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return CampaignTemplate.objects.active().filter(client=self.request.client)

    @action(detail=True, methods=["post"], url_path="clone")
    def clone_campaign(self, request, pk=None):
        template = self.get_object()
        from apps.brands.models import Brand
        brand_id = request.data.get("brand_id")
        title = request.data.get("title", f"Campaign from {template.name}")
        if not brand_id:
            return Response({"detail": "brand_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        campaign = Campaign.objects.create(
            client=request.client,
            brand_id=brand_id,
            title=title,
            budget=template.default_budget,
            target_audience=template.target_audience,
            created_by=request.employee,
        )
        return Response(CampaignDetailSerializer(campaign).data, status=status.HTTP_201_CREATED)


# ── Creator-Brand Relationships ───────────────────────────────

class CreatorAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorAvailabilitySerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return CreatorAvailability.objects.filter(
            creator__client=self.request.client,
        ).select_related("creator")

    def get_queryset(self):
        qs = CreatorAvailability.objects.filter(
            creator__client=self.request.client,
        ).select_related("creator")
        creator_id = self.request.query_params.get("creator")
        if creator_id:
            qs = qs.filter(creator_id=creator_id)
        return qs


class BrandExclusivityViewSet(viewsets.ModelViewSet):
    serializer_class = BrandExclusivitySerializer
    permission_classes = [IsEmployee, RequirePermission("brands")]

    def get_queryset(self):
        return BrandExclusivity.objects.active().filter(
            client=self.request.client,
        ).select_related("brand", "creator")


class CreatorBrandPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorBrandPreferenceSerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        qs = CreatorBrandPreference.objects.active().filter(
            client=self.request.client,
        ).select_related("creator", "brand")
        creator_id = self.request.query_params.get("creator")
        brand_id = self.request.query_params.get("brand")
        if creator_id:
            qs = qs.filter(creator_id=creator_id)
        if brand_id:
            qs = qs.filter(brand_id=brand_id)
        return qs


# ── Campaign Calendar & Deadlines ─────────────────────────────

class CampaignDeadlineViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignDeadlineSerializer
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def get_queryset(self):
        return CampaignDeadline.objects.filter(
            campaign_id=self.kwargs["campaign_pk"],
            campaign__client=self.request.client,
        ).select_related("assigned_to")

    def perform_create(self, serializer):
        serializer.save(campaign_id=self.kwargs["campaign_pk"])

    @action(detail=True, methods=["post"])
    def complete(self, request, campaign_pk=None, pk=None):
        deadline = self.get_object()
        from django.utils import timezone
        deadline.is_completed = True
        deadline.completed_at = timezone.now()
        deadline.save(update_fields=["is_completed", "completed_at"])
        return Response(CampaignDeadlineSerializer(deadline).data)


class CalendarViewSet(viewsets.ViewSet):
    """Read-only calendar aggregation across all campaigns."""
    permission_classes = [IsEmployee, RequirePermission("campaigns")]

    def list(self, request):
        from datetime import datetime
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        qs = CampaignDeadline.objects.filter(
            campaign__client=request.client,
        ).select_related("campaign", "assigned_to")
        if start:
            qs = qs.filter(due_date__gte=start)
        if end:
            qs = qs.filter(due_date__lte=end)
        data = CampaignDeadlineSerializer(qs, many=True).data
        return Response(data)
