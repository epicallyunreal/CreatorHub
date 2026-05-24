from django.contrib.auth.hashers import check_password, make_password
from django.db import models

from core.models import TenantSoftDeleteModel


class Employee(TenantSoftDeleteModel):
    """
    Client-level user. Logs in at {slug}.collabiq.com.
    Permissions determined by role + per-employee overrides.
    """
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    username = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    profile_image = models.ImageField(upload_to="employees/profiles/", blank=True, null=True)
    date_of_joining = models.DateField(null=True, blank=True)
    password = models.CharField(max_length=128)
    designation = models.CharField(max_length=100, blank=True)

    role = models.ForeignKey(
        "roles.Role",
        on_delete=models.PROTECT,
        related_name="employees",
    )
    reports_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="direct_reports",
    )
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_employees",
    )

    class Meta:
        db_table = "employee"
        unique_together = [
            ("client", "email"),
            ("client", "username"),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.client})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def save(self, *args, **kwargs):
        # Ensure password is hashed if set as plain text
        if self.password and not self.password.startswith(("pbkdf2_sha256$", "argon2$", "bcrypt$")):
            self.set_password(self.password)
        super().save(*args, **kwargs)

    def get_all_reports(self):
        """Get all employees in the reporting chain (direct + transitive)."""
        reports = set()
        queue = list(self.direct_reports.active())
        while queue:
            emp = queue.pop()
            if emp.id not in reports:
                reports.add(emp.id)
                queue.extend(emp.direct_reports.active())
        return Employee.objects.filter(id__in=reports)


class EmployeeTag(TenantSoftDeleteModel):
    """Flexible team/group tags for employees (e.g., 'Campaign Team', 'Finance')."""
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#6366f1", help_text="Hex color code")

    class Meta:
        db_table = "employee_tag"
        unique_together = [("client", "name")]

    def __str__(self):
        return self.name


class EmployeeTagMapping(models.Model):
    """M2M through table: Employee <-> EmployeeTag."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="tag_mappings"
    )
    tag = models.ForeignKey(
        EmployeeTag, on_delete=models.CASCADE, related_name="employee_mappings"
    )

    class Meta:
        db_table = "employee_tag_mapping"
        unique_together = [("employee", "tag")]

    def __str__(self):
        return f"{self.employee} -> {self.tag}"


class EmployeePermissionOverride(models.Model):
    """
    Per-employee permission override. Supersedes role permissions.
    GRANT: gives a permission the role doesn't have.
    DENY: revokes a permission the role grants.
    """
    class Effect(models.TextChoices):
        GRANT = "grant", "Grant"
        DENY = "deny", "Deny"

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="permission_overrides"
    )
    permission = models.ForeignKey(
        "roles.Permission", on_delete=models.CASCADE, related_name="employee_overrides"
    )
    effect = models.CharField(max_length=5, choices=Effect.choices)

    class Meta:
        db_table = "employee_permission_override"
        unique_together = [("employee", "permission")]

    def __str__(self):
        return f"{self.employee} | {self.permission.code} = {self.effect}"
