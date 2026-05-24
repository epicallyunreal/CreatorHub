from rest_framework import serializers

from apps.configurations.models import (
    AdFormat,
    ApproximateCharge,
    BusinessType,
    Domain,
    Platform,
    Tag,
    TagMapping,
)


class PlatformSerializer(serializers.ModelSerializer):
    is_global = serializers.BooleanField(read_only=True)

    class Meta:
        model = Platform
        fields = ["id", "name", "icon", "base_url", "is_active", "is_global"]
        read_only_fields = ["id", "is_global"]


class BusinessTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessType
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdFormatSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.name", read_only=True)
    is_global = serializers.BooleanField(read_only=True)

    class Meta:
        model = AdFormat
        fields = ["id", "platform", "platform_name", "name", "description", "is_active", "is_global"]
        read_only_fields = ["id", "is_global"]


class ApproximateChargeSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.name", read_only=True)
    domain_name = serializers.CharField(source="domain.name", read_only=True)
    ad_format_name = serializers.CharField(source="ad_format.name", read_only=True)

    class Meta:
        model = ApproximateCharge
        fields = [
            "id", "platform", "platform_name", "domain", "domain_name",
            "ad_format", "ad_format_name", "min_charge", "max_charge",
            "currency", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "color", "entity_type", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class TagMappingSerializer(serializers.ModelSerializer):
    tag_name = serializers.CharField(source="tag.name", read_only=True)
    tag_color = serializers.CharField(source="tag.color", read_only=True)

    class Meta:
        model = TagMapping
        fields = ["id", "tag", "tag_name", "tag_color", "entity_type", "entity_id"]
        read_only_fields = ["id"]
