from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "actor_type", "actor_id", "actor_name", "action",
            "entity_type", "entity_id", "entity_repr", "changes",
            "ip_address", "timestamp",
        ]
