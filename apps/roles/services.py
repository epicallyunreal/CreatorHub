from apps.roles.models import Permission, Role, RolePermission

# Default roles and their permissions (seeded on client onboarding)
DEFAULT_ROLES = {
    "Admin": {
        "description": "Full access to all modules.",
        "permissions": [
            "brands.manage", "creators.manage", "campaigns.manage",
            "payouts.manage", "payouts.approve",
            "reports.manage", "config.manage",
            "employees.manage", "roles.manage",
            "notifications.view", "notifications.manage_preferences",
            "audit.view",
        ],
    },
    "Brand Manager": {
        "description": "Manages brands and views campaigns/reports.",
        "permissions": [
            "brands.manage",
            "campaigns.view",
            "reports.view", "reports.export",
            "notifications.view", "notifications.manage_preferences",
        ],
    },
    "Creator Manager": {
        "description": "Manages creators and views campaigns/reports.",
        "permissions": [
            "creators.manage",
            "campaigns.view",
            "reports.view", "reports.export",
            "notifications.view", "notifications.manage_preferences",
        ],
    },
    "Campaign Manager": {
        "description": "Manages campaigns, assigns creators, creates payouts.",
        "permissions": [
            "campaigns.manage",
            "brands.view",
            "creators.view",
            "payouts.create", "payouts.view",
            "reports.view", "reports.export",
            "notifications.view", "notifications.manage_preferences",
        ],
    },
    "Viewer": {
        "description": "Read-only access across all modules.",
        "permissions": [
            "brands.view", "creators.view", "campaigns.view",
            "payouts.view", "reports.view", "config.view",
            "employees.view", "roles.view",
            "notifications.view", "notifications.manage_preferences",
        ],
    },
}


def seed_default_roles(client):
    """
    Seed default roles for a client. Skips roles that already exist.
    Called on client onboarding.
    Returns the count of newly created roles.
    """
    created_count = 0

    for role_name, role_config in DEFAULT_ROLES.items():
        role, created = Role.objects.get_or_create(
            client=client,
            name=role_name,
            defaults={
                "description": role_config["description"],
                "is_default": True,
            },
        )
        if created:
            created_count += 1
            # Assign permissions
            perm_codes = role_config["permissions"]
            permissions = Permission.objects.filter(code__in=perm_codes)
            role_perms = [
                RolePermission(role=role, permission=perm)
                for perm in permissions
            ]
            RolePermission.objects.bulk_create(role_perms, ignore_conflicts=True)

    return created_count
