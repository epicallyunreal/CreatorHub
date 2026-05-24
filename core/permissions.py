"""
CollabIQ Permission Engine

Resolution order: Employee Override (GRANT/DENY) > Role Permissions > Default DENY

Usage:
    from core.permissions import has_permission
    if has_permission(employee, "campaigns.create"):
        ...
"""

from apps.roles.management.commands.seed_permissions import MANAGE_IMPLIES


def has_permission(employee, permission_code):
    """
    Check if an employee has a specific permission.

    Resolution:
    1. Check EmployeePermissionOverride for this employee + exact permission
       → GRANT: return True
       → DENY: return False
    2. Check if employee's role has this permission via RolePermission
    3. Check if employee has/role has a 'manage' shortcut that implies this permission
    4. Default: False
    """
    from apps.employees.models import EmployeePermissionOverride

    if not employee or not employee.is_active:
        return False

    # 1. Check direct override for the exact permission
    override = (
        EmployeePermissionOverride.objects
        .filter(employee=employee, permission__code=permission_code)
        .values_list("effect", flat=True)
        .first()
    )
    if override == "grant":
        return True
    if override == "deny":
        return False

    # 2. Check role permissions (exact match)
    role = employee.role
    if role and role.is_active:
        role_perm_codes = set(
            role.role_permissions
            .values_list("permission__code", flat=True)
        )

        if permission_code in role_perm_codes:
            return True

        # 3. Check if any manage shortcut in role implies this permission
        for manage_code, implied in MANAGE_IMPLIES.items():
            if manage_code in role_perm_codes and permission_code in implied:
                # But check if there's a DENY override for this specific permission
                # (already handled above — if we got here, no override exists)
                return True

    # 4. Check if any override GRANTs a manage shortcut that implies this permission
    granted_overrides = set(
        EmployeePermissionOverride.objects
        .filter(employee=employee, effect="grant")
        .values_list("permission__code", flat=True)
    )
    for manage_code, implied in MANAGE_IMPLIES.items():
        if manage_code in granted_overrides and permission_code in implied:
            return True

    return False


def get_effective_permissions(employee):
    """
    Compute the full set of effective permission codes for an employee.
    Returns a set of permission code strings.
    """
    from apps.employees.models import EmployeePermissionOverride

    if not employee or not employee.is_active:
        return set()

    # Start with role permissions
    effective = set()
    role = employee.role
    if role and role.is_active:
        role_perm_codes = set(
            role.role_permissions
            .values_list("permission__code", flat=True)
        )
        effective.update(role_perm_codes)

        # Expand manage shortcuts
        for code in list(role_perm_codes):
            if code in MANAGE_IMPLIES:
                effective.update(MANAGE_IMPLIES[code])

    # Apply overrides
    overrides = EmployeePermissionOverride.objects.filter(
        employee=employee
    ).values_list("permission__code", "effect")

    for code, effect in overrides:
        if effect == "grant":
            effective.add(code)
            # If granting a manage shortcut, expand it
            if code in MANAGE_IMPLIES:
                effective.update(MANAGE_IMPLIES[code])
        elif effect == "deny":
            effective.discard(code)

    return effective
