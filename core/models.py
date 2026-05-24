from django.db import models
from django.utils import timezone


class TimeStampMixin(models.Model):
    """Adds created_at and updated_at timestamps to any model."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def voided(self):
        return self.filter(is_active=False)

    def void(self):
        return self.update(is_active=False, voided_at=timezone.now())

    def restore(self):
        return self.update(is_active=True, voided_at=None)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def voided(self):
        return self.get_queryset().voided()


class SoftDeleteMixin(models.Model):
    """Soft delete: sets is_active=False and records voided_at. Never hard deletes."""
    is_active = models.BooleanField(default=True, db_index=True)
    voided_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Bypass soft delete filter

    class Meta:
        abstract = True

    def void(self):
        self.is_active = False
        self.voided_at = timezone.now()
        self.save(update_fields=["is_active", "voided_at"])

    def restore(self):
        self.is_active = True
        self.voided_at = None
        self.save(update_fields=["is_active", "voided_at"])

    def delete(self, *args, **kwargs):
        """Override delete to perform soft delete instead."""
        self.void()


class TenantMixin(models.Model):
    """Adds client FK for multi-tenancy. All tenant-scoped models inherit this."""
    client = models.ForeignKey(
        "accounts.Client",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
        db_index=True,
    )

    class Meta:
        abstract = True


class TenantSoftDeleteModel(TenantMixin, SoftDeleteMixin, TimeStampMixin):
    """Combines tenant isolation, soft delete, and timestamps. Most models inherit this."""

    class Meta:
        abstract = True

    class Meta:
        abstract = True
