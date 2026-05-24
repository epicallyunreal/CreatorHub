from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import ClientSubscriptionViewSet

router = DefaultRouter()
router.register("", ClientSubscriptionViewSet, basename="client-subscription")

urlpatterns = [
    path("", include(router.urls)),
]
