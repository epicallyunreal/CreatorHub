from django.db.models import Avg, Count, Q, Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.brands.models import Brand
from apps.campaigns.models import Campaign, CampaignContent, CampaignMetric
from apps.creators.models import Creator
from apps.payouts.models import Payout
from apps.reports.models import SavedReport
from apps.reports.serializers import SavedReportSerializer
from core.drf_permissions import IsEmployee, RequirePermission


class DashboardView(APIView):
    permission_classes = [IsEmployee, RequirePermission("reports.view")]

    def get(self, request):
        client = request.client
        data = {
            "brands": {
                "total": Brand.objects.active().filter(client=client).count(),
            },
            "creators": {
                "total": Creator.objects.active().filter(client=client).count(),
            },
            "campaigns": {
                "total": Campaign.objects.active().filter(client=client).count(),
                "active": Campaign.objects.active().filter(client=client, status="active").count(),
                "completed": Campaign.objects.active().filter(client=client, status="completed").count(),
                "by_stage": dict(
                    Campaign.objects.active()
                    .filter(client=client)
                    .values_list("current_stage")
                    .annotate(count=Count("id"))
                ),
            },
            "payouts": {
                "total_pending": (
                    Payout.objects.filter(
                        payout_config__campaign_creator__campaign__client=client,
                        status="pending",
                    ).aggregate(total=Sum("amount"))["total"]
                    or 0
                ),
                "total_paid": (
                    Payout.objects.filter(
                        payout_config__campaign_creator__campaign__client=client,
                        status="paid",
                    ).aggregate(total=Sum("amount"))["total"]
                    or 0
                ),
            },
        }
        return Response(data)


class CampaignReportView(APIView):
    permission_classes = [IsEmployee, RequirePermission("reports.view")]

    def get(self, request):
        client = request.client
        campaigns = Campaign.objects.active().filter(client=client)

        campaign_id = request.query_params.get("campaign_id")
        if campaign_id:
            campaigns = campaigns.filter(id=campaign_id)

        data = campaigns.annotate(
            total_creators=Count("campaign_creators"),
            total_budget=Sum("budget"),
        ).values(
            "id", "title", "status", "current_stage", "budget",
            "total_creators", "start_date", "end_date",
        )
        return Response(list(data))


class CreatorReportView(APIView):
    permission_classes = [IsEmployee, RequirePermission("reports.view")]

    def get(self, request):
        client = request.client
        creators = (
            Creator.objects.active()
            .filter(client=client)
            .annotate(
                campaign_count=Count("campaign_assignments"),
                total_earned=Sum(
                    "campaign_assignments__payout_configs__payouts__amount",
                    filter=Q(
                        campaign_assignments__payout_configs__payouts__status="paid"
                    ),
                ),
            )
            .values("id", "name", "email", "campaign_count", "total_earned")
        )
        return Response(list(creators))


class BrandReportView(APIView):
    permission_classes = [IsEmployee, RequirePermission("reports.view")]

    def get(self, request):
        client = request.client
        brands = (
            Brand.objects.active()
            .filter(client=client)
            .annotate(
                campaign_count=Count("campaigns"),
                total_spend=Sum("campaigns__budget"),
            )
            .values("id", "name", "campaign_count", "total_spend")
        )
        return Response(list(brands))


class FinancialReportView(APIView):
    permission_classes = [IsEmployee, RequirePermission("reports.view")]

    def get(self, request):
        client = request.client
        payouts_qs = Payout.objects.filter(
            payout_config__campaign_creator__campaign__client=client,
        )
        data = {
            "by_status": dict(
                payouts_qs.values_list("status")
                .annotate(total=Sum("amount"))
            ),
            "total": payouts_qs.aggregate(total=Sum("amount"))["total"] or 0,
            "count": payouts_qs.count(),
        }
        return Response(data)


class SavedReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEmployee, RequirePermission("reports")]
    serializer_class = SavedReportSerializer

    def get_queryset(self):
        return SavedReport.objects.active().filter(client=self.request.client)

    def perform_create(self, serializer):
        serializer.save(client=self.request.client, generated_by=self.request.employee)


class BrandPerformanceView(APIView):
    """Phase 5.1 — Detailed brand performance dashboard."""
    permission_classes = [IsEmployee, RequirePermission("reports.view")]

    def get(self, request):
        client = request.client
        brand_id = request.query_params.get("brand_id")
        brands = Brand.objects.active().filter(client=client)
        if brand_id:
            brands = brands.filter(id=brand_id)

        data = []
        for brand in brands.annotate(
            campaign_count=Count("campaigns"),
            active_campaigns=Count("campaigns", filter=Q(campaigns__status="active")),
            total_spend=Sum("campaigns__budget"),
        ):
            total_paid = Payout.objects.filter(
                payout_config__campaign_creator__campaign__brand=brand,
                status="paid",
            ).aggregate(total=Sum("amount"))["total"] or 0

            total_content = CampaignContent.objects.filter(
                campaign__brand=brand,
            ).count()

            data.append({
                "id": brand.id,
                "name": brand.name,
                "campaign_count": brand.campaign_count,
                "active_campaigns": brand.active_campaigns,
                "total_budget": brand.total_spend or 0,
                "total_paid": total_paid,
                "total_content_pieces": total_content,
            })
        return Response(data)


class CreatorPerformanceView(APIView):
    """Phase 5.2 — Detailed creator performance dashboard."""
    permission_classes = [IsEmployee, RequirePermission("reports.view")]

    def get(self, request):
        client = request.client
        creator_id = request.query_params.get("creator_id")
        creators = Creator.objects.active().filter(client=client)
        if creator_id:
            creators = creators.filter(id=creator_id)

        data = []
        for creator in creators.annotate(
            campaign_count=Count("campaign_assignments"),
            total_earned=Sum(
                "campaign_assignments__payout_configs__payouts__amount",
                filter=Q(campaign_assignments__payout_configs__payouts__status="paid"),
            ),
            avg_engagement=Avg("platforms__engagement_rate"),
        ):
            total_content = CampaignContent.objects.filter(
                campaign_creator__creator=creator,
            ).count()

            published_content = CampaignContent.objects.filter(
                campaign_creator__creator=creator,
                status="published",
            ).count()

            total_views = CampaignMetric.objects.filter(
                campaign_content__campaign_creator__creator=creator,
                metric_type="views",
            ).aggregate(total=Sum("value"))["total"] or 0

            data.append({
                "id": creator.id,
                "name": creator.name,
                "campaign_count": creator.campaign_count,
                "total_earned": creator.total_earned or 0,
                "avg_engagement_rate": float(creator.avg_engagement or 0),
                "total_content": total_content,
                "published_content": published_content,
                "total_views": total_views,
            })
        return Response(data)
