from django.db import models


class AuditLog(models.Model):
    """
    Immutable log of all significant actions in the system.
    Never deleted. Tenant-scoped where applicable.
    """

    class Action(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        VOID = "void", "Void"
        RESTORE = "restore", "Restore"
        LOGIN = "login", "Login"
        EXPORT = "export", "Export"
        APPROVE = "approve", "Approve"

    client = models.ForeignKey(
        "accounts.Client",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    actor_type = models.CharField(
        max_length=10,
        choices=[("user", "Super Admin"), ("employee", "Employee")],
    )
    actor_id = models.BigIntegerField()
    actor_name = models.CharField(max_length=300)

    action = models.CharField(max_length=10, choices=Action.choices)
    entity_type = models.CharField(max_length=100, help_text="e.g., Brand, Campaign, Employee")
    entity_id = models.BigIntegerField(null=True, blank=True)
    entity_repr = models.CharField(max_length=300, blank=True)

    changes = models.JSONField(default=dict, blank=True, help_text="Diff of changed fields")
    metadata = models.JSONField(default=dict, blank=True, help_text="Extra context (IP, etc.)")

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_log"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["client", "entity_type", "entity_id"]),
            models.Index(fields=["actor_type", "actor_id"]),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.actor_name} {self.action} {self.entity_type}:{self.entity_id}"
