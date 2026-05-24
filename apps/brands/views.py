from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.brands.models import Brand, BrandContact
from apps.brands.serializers import BrandContactSerializer, BrandSerializer
from core.drf_permissions import IsEmployee, RequirePermission
from core.mixins import AuditMixin


class BrandViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = BrandSerializer
    permission_classes = [IsEmployee, RequirePermission("brands")]
    search_fields = ["name", "contact_email", "industry"]
    ordering_fields = ["name", "created_at"]
    filterset_fields = ["business_type", "is_active", "country"]

    def get_queryset(self):
        return (
            Brand.objects.active()
            .filter(client=self.request.client)
            .select_related("business_type", "created_by")
            .prefetch_related("contacts")
        )

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        brand = Brand.all_objects.filter(client=request.client, pk=pk).first()
        if not brand:
            return Response(status=status.HTTP_404_NOT_FOUND)
        brand.restore()
        return Response(BrandSerializer(brand).data)


class BrandContactViewSet(viewsets.ModelViewSet):
    serializer_class = BrandContactSerializer
    permission_classes = [IsEmployee, RequirePermission("brands")]

    def get_queryset(self):
        return BrandContact.objects.active().filter(
            brand_id=self.kwargs["brand_pk"],
            brand__client=self.request.client,
        )

    def perform_create(self, serializer):
        serializer.save(
            brand_id=self.kwargs["brand_pk"],
            client=self.request.client,
        )
