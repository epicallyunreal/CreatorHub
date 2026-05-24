from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import ClientSubscriptionViewSet, ClientViewSet, SubscriptionPlanViewSet

router = DefaultRouter()
router.register("", ClientViewSet, basename="client")

urlpatterns = [
    path("", include(router.urls)),
]
