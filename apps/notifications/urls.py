from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.notifications.views import (
    NotificationPreferenceViewSet,
    NotificationTemplateViewSet,
    NotificationViewSet,
)

router = SimpleRouter()
router.register("templates", NotificationTemplateViewSet, basename="notification-template")
router.register("preferences", NotificationPreferenceViewSet, basename="notification-preference")
router.register("", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
]
