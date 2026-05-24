from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.reports.views import (
    BrandPerformanceView,
    BrandReportView,
    CampaignReportView,
    CreatorPerformanceView,
    CreatorReportView,
    DashboardView,
    FinancialReportView,
    SavedReportViewSet,
)

router = SimpleRouter()
router.register("saved", SavedReportViewSet, basename="saved-report")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="report-dashboard"),
    path("campaigns/", CampaignReportView.as_view(), name="report-campaigns"),
    path("creators/", CreatorReportView.as_view(), name="report-creators"),
    path("brands/", BrandReportView.as_view(), name="report-brands"),
    path("financial/", FinancialReportView.as_view(), name="report-financial"),
    path("brand-performance/", BrandPerformanceView.as_view(), name="brand-performance"),
    path("creator-performance/", CreatorPerformanceView.as_view(), name="creator-performance"),
    path("", include(router.urls)),
]
