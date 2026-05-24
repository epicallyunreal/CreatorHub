"""
DRF Permission classes for CollabIQ.

Usage in views:
    from core.drf_permissions import IsSuperAdmin, IsEmployee, RequirePermission

    class BrandViewSet(viewsets.ModelViewSet):
        permission_classes = [IsEmployee, RequirePermission("brands")]
        # Automatically maps: list/retrieve -> brands.view, create -> brands.create, etc.

    # Or for specific permissions:
    class PayoutApproveView(APIView):
        permission_classes = [IsEmployee, RequirePermission("payouts.approve")]
"""

from rest_framework.permissions import BasePermission

from core.permissions import has_permission


class IsSuperAdmin(BasePermission):
    """Only allow platform-level Super Admin users (User model) on naked domain."""

    def has_permission(self, request, view):
        if getattr(request, "tenant_type", None) != "platform":
            return False
        user = request.user
        return (
            user
            and user.is_authenticated
            and hasattr(user, "is_superadmin")
            and user.is_superadmin
        )


class IsEmployee(BasePermission):
    """Only allow authenticated employees on a client subdomain."""

    def has_permission(self, request, view):
        if getattr(request, "tenant_type", None) != "client":
            return False
        employee = getattr(request, "employee", None)
        return employee is not None and employee.is_active


class RequirePermission(BasePermission):
    """
    Check CollabIQ permissions for the current employee.

    Can be used in two ways:
    1. Module-level: RequirePermission("brands")
       - Automatically maps DRF action to permission:
         list/retrieve -> module.view
         create -> module.create
         update/partial_update -> module.edit
         destroy -> module.void
    2. Exact permission: RequirePermission("payouts.approve")
       - Checks the exact permission code.
    """

    # Map DRF viewset actions to permission actions
    ACTION_MAP = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "partial_update": "edit",
        "destroy": "void",
    }

    def __init__(self, permission_or_module=None):
        self.permission_or_module = permission_or_module

    def __call__(self):
        """Make this work both as RequirePermission("x") and as a class."""
        return self

    def has_permission(self, request, view):
        employee = getattr(request, "employee", None)
        if not employee:
            return False

        perm_code = self._resolve_permission(request, view)
        if not perm_code:
            return True  # No specific permission required

        return has_permission(employee, perm_code)

    def _resolve_permission(self, request, view):
        if not self.permission_or_module:
            return None

        # If it already contains a dot, it's an exact permission
        if "." in self.permission_or_module:
            return self.permission_or_module

        # Module-level: map action to permission
        action = getattr(view, "action", None)
        if action and action in self.ACTION_MAP:
            return f"{self.permission_or_module}.{self.ACTION_MAP[action]}"

        # For non-viewset views, try to map HTTP method
        method_map = {
            "GET": "view",
            "POST": "create",
            "PUT": "edit",
            "PATCH": "edit",
            "DELETE": "void",
        }
        method_action = method_map.get(request.method)
        if method_action:
            return f"{self.permission_or_module}.{method_action}"

        return None


class IsEmployeeOrSuperAdmin(BasePermission):
    """Allow either Super Admin on platform or Employee on client subdomain."""

    def has_permission(self, request, view):
        return (
            IsSuperAdmin().has_permission(request, view)
            or IsEmployee().has_permission(request, view)
        )
