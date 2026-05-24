from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.payouts.models import Invoice, Payout, PayoutConfig, PayoutMilestone, PayoutType
from apps.payouts.serializers import (
    InvoiceSerializer,
    PayoutApproveSerializer,
    PayoutConfigSerializer,
    PayoutMilestoneSerializer,
    PayoutSerializer,
    PayoutTypeSerializer,
)
from core.drf_permissions import IsEmployee, RequirePermission
from core.permissions import has_permission


class PayoutTypeViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutTypeSerializer
    permission_classes = [IsEmployee, RequirePermission("payouts")]

    def get_queryset(self):
        return PayoutType.objects.active().filter(client=self.request.client)


class PayoutConfigViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutConfigSerializer
    permission_classes = [IsEmployee, RequirePermission("payouts")]

    def get_queryset(self):
        return (
            PayoutConfig.objects.filter(
                campaign_creator__campaign__client=self.request.client,
            )
            .select_related("payout_type")
            .prefetch_related("milestones", "payouts")
        )


class PayoutMilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutMilestoneSerializer
    permission_classes = [IsEmployee, RequirePermission("payouts")]

    def get_queryset(self):
        return PayoutMilestone.objects.filter(
            payout_config_id=self.kwargs["config_pk"],
            payout_config__campaign_creator__campaign__client=self.request.client,
        )

    def perform_create(self, serializer):
        serializer.save(payout_config_id=self.kwargs["config_pk"])


class PayoutViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [IsEmployee, RequirePermission("payouts")]

    def get_queryset(self):
        return (
            Payout.objects.filter(
                payout_config__campaign_creator__campaign__client=self.request.client,
            )
            .select_related("requested_by", "approved_by", "invoice")
        )

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        payout = self.get_object()
        employee = request.employee
        if not has_permission(employee, "payouts.approve"):
            return Response(
                {"detail": "Permission denied: payouts.approve required."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = PayoutApproveSerializer(
            data=request.data,
            context={"payout": payout, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        payout = serializer.save()
        return Response(PayoutSerializer(payout).data)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsEmployee, RequirePermission("payouts")]

    def get_queryset(self):
        return Invoice.objects.filter(
            payout__payout_config__campaign_creator__campaign__client=self.request.client,
        )
