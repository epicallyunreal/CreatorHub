from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.roles.models import Permission, Role, RolePermission
from apps.roles.serializers import (
    PermissionSerializer,
    RoleAssignPermissionsSerializer,
    RoleDetailSerializer,
    RoleListSerializer,
)
from core.drf_permissions import IsEmployee, RequirePermission
from core.mixins import AuditMixin


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """List all available permissions (read-only, for UI)."""
    serializer_class = PermissionSerializer
    permission_classes = [IsEmployee]
    queryset = Permission.objects.all().order_by("module", "action")
    pagination_class = None


class RoleViewSet(AuditMixin, viewsets.ModelViewSet):
    permission_classes = [IsEmployee, RequirePermission("roles")]
    search_fields = ["name"]
    filterset_fields = ["is_active", "is_default"]

    def get_queryset(self):
        return (
            Role.objects.active()
            .filter(client=self.request.client)
            .annotate(employee_count=Count("employees"))
        )

    def get_serializer_class(self):
        if self.action == "list":
            return RoleListSerializer
        return RoleDetailSerializer

    @action(detail=True, methods=["post"], url_path="permissions")
    def assign_permissions(self, request, pk=None):
        role = self.get_object()
        serializer = RoleAssignPermissionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        permission_ids = serializer.validated_data["permission_ids"]
        # Replace all permissions atomically
        RolePermission.objects.filter(role=role).delete()
        perms = Permission.objects.filter(id__in=permission_ids)
        RolePermission.objects.bulk_create(
            [RolePermission(role=role, permission=p) for p in perms]
        )
        return Response(RoleDetailSerializer(role).data)
