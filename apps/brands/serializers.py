from rest_framework import serializers

from apps.brands.models import Brand, BrandContact


class BrandContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandContact
        fields = [
            "id", "brand", "name", "email", "phone", "designation",
            "is_primary", "notes", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BrandSerializer(serializers.ModelSerializer):
    business_type_name = serializers.CharField(source="business_type.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    contacts = BrandContactSerializer(many=True, read_only=True)

    class Meta:
        model = Brand
        fields = [
            "id", "name", "contact_email", "contact_phone", "location", "country",
            "business_type", "business_type_name", "industry", "website",
            "social_links", "description", "logo", "budget_range_min",
            "budget_range_max", "is_active", "created_by", "created_by_name",
            "contacts", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        validated_data["created_by"] = getattr(request, "employee", None)
        return super().create(validated_data)
