import re

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from slugify import slugify

from core.models import SoftDeleteMixin, TimeStampMixin


# ---------------------------------------------------------------------------
# User (Super Admin only — platform-level)
# ---------------------------------------------------------------------------

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("is_superadmin", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """Platform-level user. Only Super Admins use this model."""
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "collabiq_user"

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


# ---------------------------------------------------------------------------
# Subscription Plan
# ---------------------------------------------------------------------------

class SubscriptionPlan(TimeStampMixin):
    class Tier(models.TextChoices):
        STARTER = "starter", "Starter"
        PRO = "pro", "Pro"
        ENTERPRISE = "enterprise", "Enterprise"

    name = models.CharField(max_length=100)
    tier = models.CharField(max_length=20, choices=Tier.choices, unique=True)
    max_brands = models.PositiveIntegerField(default=10)
    max_creators = models.PositiveIntegerField(default=50)
    max_campaigns = models.PositiveIntegerField(default=20)
    max_employees = models.PositiveIntegerField(default=5)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    features = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "subscription_plan"

    def __str__(self):
        return f"{self.name} ({self.tier})"


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class Client(SoftDeleteMixin, TimeStampMixin):
    company_name = models.CharField(max_length=255)
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="Subdomain identifier. Auto-generated, editable on creation only.",
    )
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to="clients/logos/", blank=True, null=True)
    subscription_plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="clients",
        null=True,
        blank=True,
    )
    onboarded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "client"

    def __str__(self):
        return self.company_name

    def save(self, *args, **kwargs):
        if not self.pk:
            # Auto-generate slug from company name if not provided
            if not self.slug:
                self.slug = self._generate_unique_slug()
            # Validate slug format
            self._validate_slug()
        else:
            # Slug is immutable after creation — revert any changes
            try:
                original = Client.all_objects.get(pk=self.pk)
                self.slug = original.slug
            except Client.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base_slug = slugify(self.company_name)
        slug = base_slug
        counter = 1
        while Client.all_objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def _validate_slug(self):
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", self.slug):
            raise ValueError(
                "Slug must be lowercase alphanumeric with hyphens only."
            )
        reserved = {"www", "api", "admin", "app", "mail", "ftp", "static", "media"}
        if self.slug in reserved:
            raise ValueError(f"'{self.slug}' is a reserved subdomain.")


# ---------------------------------------------------------------------------
# Client Subscription
# ---------------------------------------------------------------------------

class ClientSubscription(TimeStampMixin):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="subscriptions"
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name="subscriptions"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    billing_cycle = models.CharField(
        max_length=10, choices=BillingCycle.choices, default=BillingCycle.MONTHLY
    )
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        db_table = "client_subscription"

    def __str__(self):
        return f"{self.client} — {self.plan} ({self.status})"
