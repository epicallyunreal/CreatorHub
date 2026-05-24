from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.employees.models import Employee, EmployeePermissionOverride, EmployeeTag
from apps.employees.serializers import (
    EmployeeCreateSerializer,
    EmployeeDetailSerializer,
    EmployeeListSerializer,
    EmployeePermissionOverrideSerializer,
    EmployeeSelfUpdateSerializer,
    EmployeeTagSerializer,
    PasswordChangeSerializer,
)
from core.drf_permissions import IsEmployee, RequirePermission
from core.mixins import AuditMixin
from core.permissions import get_effective_permissions


class EmployeeViewSet(AuditMixin, viewsets.ModelViewSet):
    permission_classes = [IsEmployee, RequirePermission("employees")]
    search_fields = ["first_name", "last_name", "email", "username"]
    ordering_fields = ["first_name", "last_name", "created_at"]
    filterset_fields = ["role", "is_active"]

    def get_queryset(self):
        return (
            Employee.objects.active()
            .filter(client=self.request.client)
            .select_related("role", "reports_to")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return EmployeeListSerializer
        if self.action == "create":
            return EmployeeCreateSerializer
        return EmployeeDetailSerializer

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        employee = request.employee
        if request.method == "PATCH":
            serializer = EmployeeSelfUpdateSerializer(
                employee, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(EmployeeDetailSerializer(employee).data)

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        employee = request.employee
        serializer = PasswordChangeSerializer(
            data=request.data, context={"employee": employee}
        )
        serializer.is_valid(raise_exception=True)
        employee.set_password(serializer.validated_data["new_password"])
        employee.save(update_fields=["password"])
        return Response({"detail": "Password changed successfully."})

    @action(detail=True, methods=["get"], url_path="permissions")
    def permissions(self, request, pk=None):
        employee = self.get_object()
        return Response({"permissions": sorted(get_effective_permissions(employee))})

    @action(detail=True, methods=["get", "post"], url_path="overrides")
    def overrides(self, request, pk=None):
        employee = self.get_object()
        if request.method == "POST":
            serializer = EmployeePermissionOverrideSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(employee=employee)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        overrides = employee.permission_overrides.select_related("permission")
        return Response(EmployeePermissionOverrideSerializer(overrides, many=True).data)

    @action(detail=True, methods=["get"], url_path="reports")
    def reports(self, request, pk=None):
        employee = self.get_object()
        direct = employee.direct_reports.active().select_related("role")
        return Response(EmployeeListSerializer(direct, many=True).data)

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request, pk=None):
        emp = Employee.all_objects.filter(client=request.client, pk=pk).first()
        if not emp:
            return Response(status=status.HTTP_404_NOT_FOUND)
        emp.restore()
        return Response(EmployeeDetailSerializer(emp).data)


class EmployeeTagViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeTagSerializer
    permission_classes = [IsEmployee, RequirePermission("config")]

    def get_queryset(self):
        return EmployeeTag.objects.active().filter(client=self.request.client)
