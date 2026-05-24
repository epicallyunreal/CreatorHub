from rest_framework import serializers

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


class CreatorPlatformSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.name", read_only=True)

    class Meta:
        model = CreatorPlatform
        fields = [
            "id", "platform", "platform_name", "handle", "follower_count",
            "following_count", "engagement_rate", "profile_url", "is_primary",
            "last_synced_at",
        ]
        read_only_fields = ["id"]


class CreatorDomainSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source="domain.name", read_only=True)

    class Meta:
        model = CreatorDomain
        fields = ["id", "domain", "domain_name", "is_primary"]
        read_only_fields = ["id"]


class CreatorChargeSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.name", read_only=True)
    ad_format_name = serializers.CharField(source="ad_format.name", read_only=True)

    class Meta:
        model = CreatorCharge
        fields = [
            "id", "platform", "platform_name", "ad_format", "ad_format_name",
            "charge_amount", "currency", "is_negotiable", "notes",
        ]
        read_only_fields = ["id"]


class CreatorFollowerHistorySerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.name", read_only=True)

    class Meta:
        model = CreatorFollowerHistory
        fields = ["id", "platform", "platform_name", "follower_count", "recorded_at"]
        read_only_fields = ["id", "recorded_at"]


class CreatorListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    platforms = CreatorPlatformSerializer(many=True, read_only=True)

    class Meta:
        model = Creator
        fields = [
            "id", "name", "email", "phone", "age", "gender", "language",
            "profile_image", "is_active", "platforms", "created_at",
        ]


class CreatorDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views."""
    platforms = CreatorPlatformSerializer(many=True, read_only=True)
    domains = CreatorDomainSerializer(many=True, read_only=True)
    charges = CreatorChargeSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = Creator
        fields = [
            "id", "name", "email", "phone", "age", "gender", "language",
            "bio", "profile_image", "is_active", "platforms", "domains",
            "charges", "created_by", "created_by_name",
            # KYC fields
            "pan_number", "gst_number", "aadhaar_number",
            "bank_account_name", "bank_account_number", "bank_ifsc", "bank_name",
            "address", "city", "state", "pincode", "upi_id",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        validated_data["created_by"] = getattr(request, "employee", None)
        return super().create(validated_data)


class CreatorDocumentSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source="verified_by.full_name", read_only=True)

    class Meta:
        model = CreatorDocument
        fields = [
            "id", "creator", "document_type", "name", "file", "expiry_date",
            "verified_by", "verified_by_name", "verified_at", "status",
            "rejection_reason", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "verified_by", "verified_at", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class MediaKitLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaKitLink
        fields = ["id", "media_kit", "title", "url", "link_type", "sort_order"]
        read_only_fields = ["id"]


class MediaKitConfigSerializer(serializers.ModelSerializer):
    links = MediaKitLinkSerializer(many=True, read_only=True)
    creator_name = serializers.CharField(source="creator.name", read_only=True)

    class Meta:
        model = MediaKitConfig
        fields = [
            "id", "creator", "creator_name", "tagline", "about",
            "highlight_stats", "theme_color", "show_contact", "show_charges",
            "is_public", "custom_url_slug", "links", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)
