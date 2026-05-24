from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.audit.views import AuditLogViewSet

router = SimpleRouter()
router.register("", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("", include(router.urls)),
]
