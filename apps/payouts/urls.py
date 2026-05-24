from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.payouts.views import (
    InvoiceViewSet,
    PayoutConfigViewSet,
    PayoutMilestoneViewSet,
    PayoutTypeViewSet,
    PayoutViewSet,
)

router = SimpleRouter()
router.register("payout-types", PayoutTypeViewSet, basename="payout-type")
router.register("payout-configs", PayoutConfigViewSet, basename="payout-config")
router.register("", PayoutViewSet, basename="payout")
router.register("invoices", InvoiceViewSet, basename="invoice")

milestone_router = SimpleRouter()
milestone_router.register("milestones", PayoutMilestoneViewSet, basename="payout-milestone")

urlpatterns = [
    path("", include(router.urls)),
    path("configs/<int:config_pk>/", include(milestone_router.urls)),
]
