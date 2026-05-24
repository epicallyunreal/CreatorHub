from django.db import models

from core.models import TenantSoftDeleteModel, TimeStampMixin


class Permission(TimeStampMixin):
    """
    Global permission registry. Seeded by management command.
    Format: module.action (e.g., brands.create, campaigns.transition_stage)
    """
    code = models.CharField(max_length=100, unique=True)
    module = models.CharField(max_length=50, db_index=True)
    action = models.CharField(max_length=50)
    description = models.CharField(max_length=255, blank=True)
    is_manage_shortcut = models.BooleanField(
        default=False,
        help_text="If True, this is a 'manage' permission that implies create+edit+void+view.",
    )

    class Meta:
        db_table = "permission"
        ordering = ["module", "action"]

    def __str__(self):
        return self.code


class Role(TenantSoftDeleteModel):
    """
    Client-scoped role. Clients can create/edit roles freely.
    Default roles are seeded on client onboarding.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(
        default=False,
        help_text="True for roles seeded on client onboarding.",
    )
    permissions = models.ManyToManyField(
        Permission,
        through="RolePermission",
        related_name="roles",
        blank=True,
    )

    class Meta:
        db_table = "role"
        unique_together = [("client", "name")]

    def __str__(self):
        return f"{self.name} ({self.client})"


class RolePermission(models.Model):
    """Join table: Role <-> Permission."""
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")

    class Meta:
        db_table = "role_permission"
        unique_together = [("role", "permission")]

    def __str__(self):
        return f"{self.role.name} -> {self.permission.code}"
