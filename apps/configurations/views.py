from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.configurations.models import (
    AdFormat,
    ApproximateCharge,
    BusinessType,
    Domain,
    Platform,
    Tag,
    TagMapping,
)
from apps.configurations.serializers import (
    AdFormatSerializer,
    ApproximateChargeSerializer,
    BusinessTypeSerializer,
    DomainSerializer,
    PlatformSerializer,
    TagMappingSerializer,
    TagSerializer,
)
from core.drf_permissions import IsEmployee, RequirePermission


class PlatformViewSet(viewsets.ModelViewSet):
    """Platforms — includes global (read-only) and client-specific (editable)."""
    serializer_class = PlatformSerializer
    permission_classes = [IsEmployee, RequirePermission("platforms")]

    def get_queryset(self):
        return Platform.objects.active().filter(
            Q(client__isnull=True) | Q(client=self.request.client)
        )

    def perform_create(self, serializer):
        serializer.save(client=self.request.client)

    def perform_update(self, serializer):
        if serializer.instance.is_global:
            raise PermissionDenied("Global platforms cannot be edited.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_global:
            raise PermissionDenied("Global platforms cannot be deleted.")
        instance.void()


class BusinessTypeViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessTypeSerializer
    permission_classes = [IsEmployee, RequirePermission("business_types")]

    def get_queryset(self):
        return BusinessType.objects.active().filter(client=self.request.client)

    def perform_create(self, serializer):
        serializer.save(client=self.request.client)


class DomainViewSet(viewsets.ModelViewSet):
    serializer_class = DomainSerializer
    permission_classes = [IsEmployee, RequirePermission("domains")]

    def get_queryset(self):
        return Domain.objects.active().filter(client=self.request.client)

    def perform_create(self, serializer):
        serializer.save(client=self.request.client)


class AdFormatViewSet(viewsets.ModelViewSet):
    """Ad formats — includes global (read-only) and client-specific (editable)."""
    serializer_class = AdFormatSerializer
    permission_classes = [IsEmployee, RequirePermission("ad_formats")]

    def get_queryset(self):
        qs = AdFormat.objects.active().select_related("platform").filter(
            Q(client__isnull=True) | Q(client=self.request.client)
        )
        platform_id = self.request.query_params.get("platform")
        if platform_id:
            qs = qs.filter(platform_id=platform_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(client=self.request.client)

    def perform_update(self, serializer):
        if serializer.instance.is_global:
            raise PermissionDenied("Global ad formats cannot be edited.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_global:
            raise PermissionDenied("Global ad formats cannot be deleted.")
        instance.void()


class ApproximateChargeViewSet(viewsets.ModelViewSet):
    serializer_class = ApproximateChargeSerializer
    permission_classes = [IsEmployee, RequirePermission("ad_formats")]

    def get_queryset(self):
        return (
            ApproximateCharge.objects.active()
            .filter(client=self.request.client)
            .select_related("platform", "domain", "ad_format")
        )

    def perform_create(self, serializer):
        serializer.save(client=self.request.client)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsEmployee, RequirePermission("team_tags")]

    def get_queryset(self):
        qs = Tag.objects.active().filter(client=self.request.client)
        entity_type = self.request.query_params.get("entity_type")
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        return qs


class TagMappingViewSet(viewsets.ModelViewSet):
    serializer_class = TagMappingSerializer
    permission_classes = [IsEmployee, RequirePermission("team_tags")]

    def get_queryset(self):
        qs = TagMapping.objects.filter(tag__client=self.request.client).select_related("tag")
        entity_type = self.request.query_params.get("entity_type")
        entity_id = self.request.query_params.get("entity_id")
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        return qs
