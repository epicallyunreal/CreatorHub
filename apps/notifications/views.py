from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.models import Notification, NotificationPreference, NotificationTemplate
from apps.notifications.serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
    NotificationTemplateSerializer,
)
from core.drf_permissions import IsEmployee, RequirePermission


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        return Notification.objects.filter(employee=self.request.employee)

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def mark_all_read(self, request):
        Notification.objects.filter(
            employee=request.employee, is_read=False
        ).update(is_read=True)
        return Response({"status": "ok"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = Notification.objects.filter(
            employee=request.employee, is_read=False
        ).count()
        return Response({"unread_count": count})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        return NotificationPreference.objects.filter(employee=self.request.employee)

    def perform_create(self, serializer):
        serializer.save(employee=self.request.employee)


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsEmployee, RequirePermission("config")]

    def get_queryset(self):
        return NotificationTemplate.objects.active().filter(client=self.request.client)
