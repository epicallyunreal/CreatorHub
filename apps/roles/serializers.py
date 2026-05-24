from rest_framework import serializers

from apps.roles.models import Permission, Role, RolePermission


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "code", "module", "action", "description", "is_manage_shortcut"]
        read_only_fields = ["id"]


class RolePermissionSerializer(serializers.ModelSerializer):
    permission_code = serializers.CharField(source="permission.code", read_only=True)

    class Meta:
        model = RolePermission
        fields = ["id", "role", "permission", "permission_code"]
        read_only_fields = ["id"]


class RoleListSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Role
        fields = ["id", "name", "description", "is_default", "is_active", "employee_count", "created_at"]


class RoleDetailSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id", "name", "description", "is_default", "is_active",
            "permissions", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_default", "created_at", "updated_at"]

    def get_permissions(self, obj):
        return list(
            obj.role_permissions.values_list("permission__code", flat=True)
        )

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class RoleAssignPermissionsSerializer(serializers.Serializer):
    """Bulk assign permissions to a role."""
    permission_ids = serializers.ListField(child=serializers.IntegerField())
