from rest_framework import serializers

from apps.employees.models import (
    Employee,
    EmployeePermissionOverride,
    EmployeeTag,
    EmployeeTagMapping,
)
from core.permissions import get_effective_permissions


class EmployeeTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeTag
        fields = ["id", "name", "color", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class EmployeePermissionOverrideSerializer(serializers.ModelSerializer):
    permission_code = serializers.CharField(source="permission.code", read_only=True)

    class Meta:
        model = EmployeePermissionOverride
        fields = ["id", "employee", "permission", "permission_code", "effect"]
        read_only_fields = ["id"]


class EmployeeListSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    reports_to_name = serializers.CharField(source="reports_to.full_name", read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id", "first_name", "last_name", "email", "username", "phone",
            "profile_image", "designation", "role", "role_name",
            "reports_to", "reports_to_name", "is_active", "date_of_joining",
            "created_at",
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    reports_to_name = serializers.CharField(source="reports_to.full_name", read_only=True)
    tags = serializers.SerializerMethodField()
    permission_overrides = EmployeePermissionOverrideSerializer(many=True, read_only=True)
    effective_permissions = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id", "first_name", "last_name", "email", "username", "phone",
            "profile_image", "date_of_joining", "designation", "role",
            "role_name", "reports_to", "reports_to_name", "is_active",
            "tags", "permission_overrides", "effective_permissions",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_tags(self, obj):
        return list(
            obj.tag_mappings.values_list("tag__name", flat=True)
        )

    def get_effective_permissions(self, obj):
        return sorted(get_effective_permissions(obj))


class EmployeeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Employee
        fields = [
            "first_name", "last_name", "email", "username", "phone",
            "profile_image", "date_of_joining", "designation", "role",
            "reports_to", "password",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        validated_data["created_by"] = getattr(request, "employee", None)
        return super().create(validated_data)


class EmployeeSelfUpdateSerializer(serializers.ModelSerializer):
    """Limited fields employees can update on their own profile."""
    class Meta:
        model = Employee
        fields = ["first_name", "last_name", "phone", "profile_image"]


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        employee = self.context["employee"]
        if not employee.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
