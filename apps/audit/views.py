from rest_framework import viewsets

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from core.drf_permissions import IsEmployee, RequirePermission


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsEmployee, RequirePermission("audit.view")]
    filterset_fields = ["action", "entity_type", "actor_type"]
    ordering_fields = ["timestamp"]

    def get_queryset(self):
        return AuditLog.objects.filter(client=self.request.client)
