from django.db import models

from core.models import TenantSoftDeleteModel


class Brand(TenantSoftDeleteModel):
    """Brand managed by a client."""
    name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=100, blank=True)
    business_type = models.ForeignKey(
        "configurations.BusinessType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="brands",
    )
    industry = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="brands/logos/", blank=True, null=True)
    budget_range_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_range_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_by = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_brands",
    )

    class Meta:
        db_table = "brand"
        unique_together = [("client", "name")]

    def __str__(self):
        return self.name


class BrandContact(TenantSoftDeleteModel):
    """Contact person at a brand company."""
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    is_primary = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "brand_contact"
        unique_together = [("brand", "email")]

    def __str__(self):
        return f"{self.name} ({self.brand.name})"
