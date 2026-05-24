from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.creators.views import (
    CreatorChargeViewSet,
    CreatorDocumentViewSet,
    CreatorDomainViewSet,
    CreatorFollowerHistoryViewSet,
    CreatorPlatformViewSet,
    CreatorViewSet,
    MediaKitConfigViewSet,
    MediaKitLinkViewSet,
)

router = SimpleRouter()
router.register("", CreatorViewSet, basename="creator")

# Nested routes for creator sub-resources
creator_platforms = SimpleRouter()
creator_platforms.register("platforms", CreatorPlatformViewSet, basename="creator-platform")

creator_domains = SimpleRouter()
creator_domains.register("domains", CreatorDomainViewSet, basename="creator-domain")

creator_charges = SimpleRouter()
creator_charges.register("charges", CreatorChargeViewSet, basename="creator-charge")

creator_history = SimpleRouter()
creator_history.register("follower-history", CreatorFollowerHistoryViewSet, basename="creator-follower-history")

creator_documents = SimpleRouter()
creator_documents.register("documents", CreatorDocumentViewSet, basename="creator-document")

creator_media_kits = SimpleRouter()
creator_media_kits.register("media-kits", MediaKitConfigViewSet, basename="creator-media-kit")

media_kit_links = SimpleRouter()
media_kit_links.register("links", MediaKitLinkViewSet, basename="media-kit-link")

urlpatterns = [
    path("", include(router.urls)),
    path("<int:creator_pk>/", include(creator_platforms.urls)),
    path("<int:creator_pk>/", include(creator_domains.urls)),
    path("<int:creator_pk>/", include(creator_charges.urls)),
    path("<int:creator_pk>/", include(creator_history.urls)),
    path("<int:creator_pk>/", include(creator_documents.urls)),
    path("<int:creator_pk>/", include(creator_media_kits.urls)),
    path("media-kits/<int:media_kit_pk>/", include(media_kit_links.urls)),
]
