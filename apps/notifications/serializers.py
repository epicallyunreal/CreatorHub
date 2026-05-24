from rest_framework import serializers

from apps.notifications.models import Notification, NotificationPreference, NotificationTemplate


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "title", "message", "notification_type", "channel",
            "entity_type", "entity_id", "is_read", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ["id", "event_type", "email", "in_app", "sms", "whatsapp"]
        read_only_fields = ["id"]


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = [
            "id", "trigger_event", "name", "title_template", "body_template",
            "channels", "is_enabled", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)
