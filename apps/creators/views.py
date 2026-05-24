from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.creators.models import (
    Creator,
    CreatorCharge,
    CreatorDocument,
    CreatorDomain,
    CreatorFollowerHistory,
    CreatorPlatform,
    MediaKitConfig,
    MediaKitLink,
)
from apps.creators.serializers import (
    CreatorChargeSerializer,
    CreatorDetailSerializer,
    CreatorDocumentSerializer,
    CreatorDomainSerializer,
    CreatorFollowerHistorySerializer,
    CreatorListSerializer,
    CreatorPlatformSerializer,
    MediaKitConfigSerializer,
    MediaKitLinkSerializer,
)
from core.drf_permissions import IsEmployee, RequirePermission
from core.mixins import AuditMixin


class CreatorViewSet(AuditMixin, viewsets.ModelViewSet):
    permission_classes = [IsEmployee, RequirePermission("creators")]
    search_fields = ["name", "email", "phone"]
    ordering_fields = ["name", "created_at"]
    filterset_fields = ["is_active", "gender"]

    def get_queryset(self):
        qs = (
            Creator.objects.active()
            .filter(client=self.request.client)
            .select_related("created_by")
            .prefetch_related("platforms__platform", "domains__domain")
        )
        # Custom filters
        params = self.request.query_params
        platform = params.get("platform")
        domain = params.get("domain")
        min_followers = params.get("min_followers")
        max_followers = params.get("max_followers")
        language = params.get("language")
        ad_format = params.get("ad_format")
        min_charge = params.get("min_charge")
        max_charge = params.get("max_charge")

        if platform:
            qs = qs.filter(platforms__platform_id=platform)
        if domain:
            qs = qs.filter(domains__domain_id=domain)
        if min_followers:
            qs = qs.filter(platforms__follower_count__gte=min_followers)
        if max_followers:
            qs = qs.filter(platforms__follower_count__lte=max_followers)
        if language:
            qs = qs.filter(language__contains=[language])
        if ad_format:
            qs = qs.filter(charges__ad_format_id=ad_format)
        if min_charge:
            qs = qs.filter(charges__charge_amount__gte=min_charge)
        if max_charge:
            qs = qs.filter(charges__charge_amount__lte=max_charge)

        return qs.distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return CreatorListSerializer
        return CreatorDetailSerializer

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        creator = Creator.all_objects.filter(client=request.client, pk=pk).first()
        if not creator:
            return Response(status=status.HTTP_404_NOT_FOUND)
        creator.restore()
        return Response(CreatorDetailSerializer(creator).data)


class CreatorPlatformViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorPlatformSerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return CreatorPlatform.objects.filter(
            creator_id=self.kwargs["creator_pk"],
            creator__client=self.request.client,
        ).select_related("platform")

    def perform_create(self, serializer):
        serializer.save(creator_id=self.kwargs["creator_pk"])


class CreatorDomainViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorDomainSerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return CreatorDomain.objects.filter(
            creator_id=self.kwargs["creator_pk"],
            creator__client=self.request.client,
        ).select_related("domain")

    def perform_create(self, serializer):
        serializer.save(creator_id=self.kwargs["creator_pk"])


class CreatorChargeViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorChargeSerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return CreatorCharge.objects.filter(
            creator_id=self.kwargs["creator_pk"],
            creator__client=self.request.client,
        ).select_related("platform", "ad_format")

    def perform_create(self, serializer):
        serializer.save(creator_id=self.kwargs["creator_pk"])


class CreatorFollowerHistoryViewSet(viewsets.mixins.ListModelMixin,
                                    viewsets.mixins.CreateModelMixin,
                                    viewsets.GenericViewSet):
    serializer_class = CreatorFollowerHistorySerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return CreatorFollowerHistory.objects.filter(
            creator_id=self.kwargs["creator_pk"],
            creator__client=self.request.client,
        ).select_related("platform")

    def perform_create(self, serializer):
        serializer.save(creator_id=self.kwargs["creator_pk"])


class CreatorDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorDocumentSerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return CreatorDocument.objects.active().filter(
            creator_id=self.kwargs["creator_pk"],
            creator__client=self.request.client,
        ).select_related("verified_by")

    def perform_create(self, serializer):
        serializer.save(
            creator_id=self.kwargs["creator_pk"],
            client=self.request.client,
        )

    @action(detail=True, methods=["post"])
    def verify(self, request, creator_pk=None, pk=None):
        doc = self.get_object()
        from django.utils import timezone
        doc.verified_by = request.employee
        doc.verified_at = timezone.now()
        doc.status = CreatorDocument.VerificationStatus.VERIFIED
        doc.save(update_fields=["verified_by", "verified_at", "status"])
        return Response(CreatorDocumentSerializer(doc).data)


class MediaKitConfigViewSet(viewsets.ModelViewSet):
    serializer_class = MediaKitConfigSerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return MediaKitConfig.objects.active().filter(
            creator_id=self.kwargs["creator_pk"],
            creator__client=self.request.client,
        ).prefetch_related("links")

    def perform_create(self, serializer):
        serializer.save(
            creator_id=self.kwargs["creator_pk"],
            client=self.request.client,
        )


class MediaKitLinkViewSet(viewsets.ModelViewSet):
    serializer_class = MediaKitLinkSerializer
    permission_classes = [IsEmployee, RequirePermission("creators")]

    def get_queryset(self):
        return MediaKitLink.objects.filter(
            media_kit_id=self.kwargs["media_kit_pk"],
            media_kit__creator__client=self.request.client,
        )

    def perform_create(self, serializer):
        serializer.save(media_kit_id=self.kwargs["media_kit_pk"])
