from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.campaigns.views import (
    BrandExclusivityViewSet,
    BriefTemplateViewSet,
    CalendarViewSet,
    CampaignBriefViewSet,
    CampaignContentViewSet,
    CampaignCreatorViewSet,
    CampaignDeadlineViewSet,
    CampaignExpenseViewSet,
    CampaignMetricViewSet,
    CampaignRequirementViewSet,
    CampaignTemplateViewSet,
    CampaignViewSet,
    ContentCommentViewSet,
    ContentRevisionViewSet,
    CreatorAvailabilityViewSet,
    CreatorBrandPreferenceViewSet,
    DeliverableChecklistViewSet,
    ExpenseCategoryViewSet,
)

router = SimpleRouter()
router.register("", CampaignViewSet, basename="campaign")

# Top-level resources (not nested under campaign)
top_router = SimpleRouter()
top_router.register("brief-templates", BriefTemplateViewSet, basename="brief-template")
top_router.register("campaign-templates", CampaignTemplateViewSet, basename="campaign-template")
top_router.register("expense-categories", ExpenseCategoryViewSet, basename="expense-category")
top_router.register("availability", CreatorAvailabilityViewSet, basename="creator-availability")
top_router.register("exclusivities", BrandExclusivityViewSet, basename="brand-exclusivity")
top_router.register("preferences", CreatorBrandPreferenceViewSet, basename="creator-brand-preference")
top_router.register("calendar", CalendarViewSet, basename="calendar")

# Nested campaign sub-resources
campaign_creators = SimpleRouter()
campaign_creators.register("creators", CampaignCreatorViewSet, basename="campaign-creator")

campaign_requirements = SimpleRouter()
campaign_requirements.register("requirements", CampaignRequirementViewSet, basename="campaign-requirement")

campaign_content = SimpleRouter()
campaign_content.register("content", CampaignContentViewSet, basename="campaign-content")

campaign_metrics = SimpleRouter()
campaign_metrics.register("metrics", CampaignMetricViewSet, basename="campaign-metric")

campaign_briefs = SimpleRouter()
campaign_briefs.register("briefs", CampaignBriefViewSet, basename="campaign-brief")

campaign_deliverables = SimpleRouter()
campaign_deliverables.register("deliverables", DeliverableChecklistViewSet, basename="campaign-deliverable")

campaign_expenses = SimpleRouter()
campaign_expenses.register("expenses", CampaignExpenseViewSet, basename="campaign-expense")

campaign_deadlines = SimpleRouter()
campaign_deadlines.register("deadlines", CampaignDeadlineViewSet, basename="campaign-deadline")

# Content sub-resources (nested under content)
content_revisions = SimpleRouter()
content_revisions.register("revisions", ContentRevisionViewSet, basename="content-revision")

content_comments = SimpleRouter()
content_comments.register("comments", ContentCommentViewSet, basename="content-comment")

urlpatterns = [
    path("", include(top_router.urls)),
    path("", include(router.urls)),
    path("<int:campaign_pk>/", include(campaign_creators.urls)),
    path("<int:campaign_pk>/", include(campaign_requirements.urls)),
    path("<int:campaign_pk>/", include(campaign_content.urls)),
    path("<int:campaign_pk>/", include(campaign_metrics.urls)),
    path("<int:campaign_pk>/", include(campaign_briefs.urls)),
    path("<int:campaign_pk>/", include(campaign_deliverables.urls)),
    path("<int:campaign_pk>/", include(campaign_expenses.urls)),
    path("<int:campaign_pk>/", include(campaign_deadlines.urls)),
    path("content/<int:content_pk>/", include(content_revisions.urls)),
    path("content/<int:content_pk>/", include(content_comments.urls)),
]
