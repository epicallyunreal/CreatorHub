from django.core.management.base import BaseCommand

from apps.roles.models import Permission

# All platform permissions: (code, module, action, description, is_manage_shortcut)
PERMISSIONS = [
    # --- brands ---
    ("brands.view", "brands", "view", "View brands", False),
    ("brands.create", "brands", "create", "Create brands", False),
    ("brands.edit", "brands", "edit", "Edit brands", False),
    ("brands.void", "brands", "void", "Void (soft-delete) brands", False),
    ("brands.manage", "brands", "manage", "Full brand management (create+edit+void+view)", True),

    # --- creators ---
    ("creators.view", "creators", "view", "View creators", False),
    ("creators.create", "creators", "create", "Create creators", False),
    ("creators.edit", "creators", "edit", "Edit creators", False),
    ("creators.void", "creators", "void", "Void (soft-delete) creators", False),
    ("creators.manage", "creators", "manage", "Full creator management (create+edit+void+view)", True),

    # --- campaigns ---
    ("campaigns.view", "campaigns", "view", "View campaigns", False),
    ("campaigns.create", "campaigns", "create", "Create campaigns", False),
    ("campaigns.edit", "campaigns", "edit", "Edit campaigns", False),
    ("campaigns.void", "campaigns", "void", "Void (soft-delete) campaigns", False),
    ("campaigns.transition_stage", "campaigns", "transition_stage", "Transition campaign lifecycle stage", False),
    ("campaigns.assign_creator", "campaigns", "assign_creator", "Assign/remove creators to campaigns", False),
    ("campaigns.manage", "campaigns", "manage", "Full campaign management (create+edit+void+view+transition+assign)", True),

    # --- payouts ---
    ("payouts.view", "payouts", "view", "View payouts", False),
    ("payouts.create", "payouts", "create", "Create payouts", False),
    ("payouts.edit", "payouts", "edit", "Edit payouts", False),
    ("payouts.void", "payouts", "void", "Void (soft-delete) payouts", False),
    ("payouts.approve", "payouts", "approve", "Approve payouts", False),
    ("payouts.manage", "payouts", "manage", "Full payout management (create+edit+void+view)", True),

    # --- reports ---
    ("reports.view", "reports", "view", "View reports and dashboards", False),
    ("reports.export", "reports", "export", "Export reports (PDF/CSV/Excel)", False),
    ("reports.manage", "reports", "manage", "Full report management (view+export)", True),

    # --- config: domains ---
    ("domains.view", "domains", "view", "View content domains", False),
    ("domains.create", "domains", "create", "Create content domains", False),
    ("domains.edit", "domains", "edit", "Edit content domains", False),
    ("domains.void", "domains", "void", "Void content domains", False),
    ("domains.manage", "domains", "manage", "Full domain management", True),

    # --- config: business_types ---
    ("business_types.view", "business_types", "view", "View business types", False),
    ("business_types.create", "business_types", "create", "Create business types", False),
    ("business_types.edit", "business_types", "edit", "Edit business types", False),
    ("business_types.void", "business_types", "void", "Void business types", False),
    ("business_types.manage", "business_types", "manage", "Full business type management", True),

    # --- config: platforms ---
    ("platforms.view", "platforms", "view", "View platforms", False),
    ("platforms.create", "platforms", "create", "Create platforms", False),
    ("platforms.edit", "platforms", "edit", "Edit platforms", False),
    ("platforms.void", "platforms", "void", "Void platforms", False),
    ("platforms.manage", "platforms", "manage", "Full platform management", True),

    # --- config: ad_formats ---
    ("ad_formats.view", "ad_formats", "view", "View ad formats", False),
    ("ad_formats.create", "ad_formats", "create", "Create ad formats", False),
    ("ad_formats.edit", "ad_formats", "edit", "Edit ad formats", False),
    ("ad_formats.void", "ad_formats", "void", "Void ad formats", False),
    ("ad_formats.manage", "ad_formats", "manage", "Full ad format management", True),

    # --- config: team_tags ---
    ("team_tags.view", "team_tags", "view", "View tags", False),
    ("team_tags.create", "team_tags", "create", "Create tags", False),
    ("team_tags.edit", "team_tags", "edit", "Edit tags", False),
    ("team_tags.void", "team_tags", "void", "Void tags", False),
    ("team_tags.manage", "team_tags", "manage", "Full tag management", True),

    # --- employees ---
    ("employees.view", "employees", "view", "View employees", False),
    ("employees.create", "employees", "create", "Create employees", False),
    ("employees.edit", "employees", "edit", "Edit employees", False),
    ("employees.void", "employees", "void", "Void (soft-delete) employees", False),
    ("employees.assign_role", "employees", "assign_role", "Assign roles to employees", False),
    ("employees.set_overrides", "employees", "set_overrides", "Set permission overrides on employees", False),
    ("employees.manage", "employees", "manage", "Full employee management (create+edit+void+view+assign_role+set_overrides)", True),

    # --- roles ---
    ("roles.view", "roles", "view", "View roles", False),
    ("roles.create", "roles", "create", "Create roles", False),
    ("roles.edit", "roles", "edit", "Edit roles", False),
    ("roles.void", "roles", "void", "Void (soft-delete) roles", False),
    ("roles.assign_permissions", "roles", "assign_permissions", "Assign permissions to roles", False),
    ("roles.manage", "roles", "manage", "Full role management (create+edit+void+view+assign_permissions)", True),

    # --- notifications ---
    ("notifications.view", "notifications", "view", "View notifications", False),
    ("notifications.manage_preferences", "notifications", "manage_preferences", "Manage notification preferences", False),

    # --- audit ---
    ("audit.view", "audit", "view", "View audit logs", False),

    # --- briefs ---
    ("briefs.view", "briefs", "view", "View campaign briefs", False),
    ("briefs.create", "briefs", "create", "Create campaign briefs", False),
    ("briefs.edit", "briefs", "edit", "Edit campaign briefs", False),
    ("briefs.manage", "briefs", "manage", "Full brief management", True),

    # --- content_reviews ---
    ("content_reviews.view", "content_reviews", "view", "View content revisions and comments", False),
    ("content_reviews.create", "content_reviews", "create", "Submit content revisions", False),
    ("content_reviews.approve", "content_reviews", "approve", "Approve/reject content", False),
    ("content_reviews.manage", "content_reviews", "manage", "Full content review management", True),

    # --- documents ---
    ("documents.view", "documents", "view", "View creator documents", False),
    ("documents.create", "documents", "create", "Upload creator documents", False),
    ("documents.verify", "documents", "verify", "Verify creator documents", False),
    ("documents.manage", "documents", "manage", "Full document management", True),

    # --- expenses ---
    ("expenses.view", "expenses", "view", "View campaign expenses", False),
    ("expenses.create", "expenses", "create", "Create campaign expenses", False),
    ("expenses.edit", "expenses", "edit", "Edit campaign expenses", False),
    ("expenses.approve", "expenses", "approve", "Approve campaign expenses", False),
    ("expenses.manage", "expenses", "manage", "Full expense management", True),

    # --- calendar ---
    ("calendar.view", "calendar", "view", "View campaign calendar", False),
    ("calendar.create", "calendar", "create", "Create deadlines", False),
    ("calendar.edit", "calendar", "edit", "Edit deadlines", False),
    ("calendar.manage", "calendar", "manage", "Full calendar management", True),

    # --- media_kits ---
    ("media_kits.view", "media_kits", "view", "View creator media kits", False),
    ("media_kits.create", "media_kits", "create", "Create media kits", False),
    ("media_kits.edit", "media_kits", "edit", "Edit media kits", False),
    ("media_kits.manage", "media_kits", "manage", "Full media kit management", True),

    # --- relationships ---
    ("relationships.view", "relationships", "view", "View creator-brand relationships", False),
    ("relationships.create", "relationships", "create", "Create relationships", False),
    ("relationships.edit", "relationships", "edit", "Edit relationships", False),
    ("relationships.manage", "relationships", "manage", "Full relationship management", True),

    # --- templates ---
    ("templates.view", "templates", "view", "View campaign/brief templates", False),
    ("templates.create", "templates", "create", "Create templates", False),
    ("templates.edit", "templates", "edit", "Edit templates", False),
    ("templates.manage", "templates", "manage", "Full template management", True),

    # --- notes ---
    ("notes.view", "notes", "view", "View notes/comments", False),
    ("notes.create", "notes", "create", "Create notes/comments", False),
    ("notes.edit", "notes", "edit", "Edit notes/comments", False),
    ("notes.void", "notes", "void", "Delete notes/comments", False),
    ("notes.manage", "notes", "manage", "Full notes management", True),
]

# Mapping: manage permission -> implied sub-permissions
MANAGE_IMPLIES = {
    "brands.manage": ["brands.create", "brands.edit", "brands.void", "brands.view"],
    "creators.manage": ["creators.create", "creators.edit", "creators.void", "creators.view"],
    "campaigns.manage": [
        "campaigns.create", "campaigns.edit", "campaigns.void", "campaigns.view",
        "campaigns.transition_stage", "campaigns.assign_creator",
    ],
    "payouts.manage": ["payouts.create", "payouts.edit", "payouts.void", "payouts.view"],
    "reports.manage": ["reports.view", "reports.export"],
    "config.manage": ["config.view", "config.create", "config.edit", "config.void"],
    "domains.manage": ["domains.view", "domains.create", "domains.edit", "domains.void"],
    "business_types.manage": ["business_types.view", "business_types.create", "business_types.edit", "business_types.void"],
    "platforms.manage": ["platforms.view", "platforms.create", "platforms.edit", "platforms.void"],
    "ad_formats.manage": ["ad_formats.view", "ad_formats.create", "ad_formats.edit", "ad_formats.void"],
    "tags.manage": ["tags.view", "tags.create", "tags.edit"],
    "team_tags.manage": ["team_tags.view", "team_tags.create", "team_tags.edit", "team_tags.void"],
    "employees.manage": [
        "employees.create", "employees.edit", "employees.void", "employees.view",
        "employees.assign_role", "employees.set_overrides",
    ],
    "roles.manage": [
        "roles.create", "roles.edit", "roles.void", "roles.view",
        "roles.assign_permissions",
    ],
    "briefs.manage": ["briefs.view", "briefs.create", "briefs.edit"],
    "content_reviews.manage": ["content_reviews.view", "content_reviews.create", "content_reviews.approve"],
    "documents.manage": ["documents.view", "documents.create", "documents.verify"],
    "expenses.manage": ["expenses.view", "expenses.create", "expenses.edit", "expenses.approve"],
    "calendar.manage": ["calendar.view", "calendar.create", "calendar.edit"],
    "media_kits.manage": ["media_kits.view", "media_kits.create", "media_kits.edit"],
    "relationships.manage": ["relationships.view", "relationships.create", "relationships.edit"],
    "templates.manage": ["templates.view", "templates.create", "templates.edit"],
    "notes.manage": ["notes.view", "notes.create", "notes.edit", "notes.void"],
}


class Command(BaseCommand):
    help = "Seed all platform permissions into the Permission table."

    def handle(self, *args, **options):
        created_count = 0
        for code, module, action, description, is_manage in PERMISSIONS:
            _, created = Permission.objects.update_or_create(
                code=code,
                defaults={
                    "module": module,
                    "action": action,
                    "description": description,
                    "is_manage_shortcut": is_manage,
                },
            )
            if created:
                created_count += 1

        total = Permission.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Permissions seeded: {created_count} created, {total} total."
            )
        )
