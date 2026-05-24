from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.configurations.views import (
    AdFormatViewSet,
    ApproximateChargeViewSet,
    BusinessTypeViewSet,
    DomainViewSet,
    PlatformViewSet,
    TagMappingViewSet,
    TagViewSet,
)

router = SimpleRouter()
router.register("platforms", PlatformViewSet, basename="platform")
router.register("business-types", BusinessTypeViewSet, basename="business-type")
router.register("domains", DomainViewSet, basename="domain")
router.register("ad-formats", AdFormatViewSet, basename="ad-format")
router.register("approx-charges", ApproximateChargeViewSet, basename="approx-charge")
router.register("tags", TagViewSet, basename="tag")
router.register("tag-mappings", TagMappingViewSet, basename="tag-mapping")

urlpatterns = [
    path("", include(router.urls)),
]
