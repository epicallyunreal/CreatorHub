from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken


# --- Onboarding Serializer ---

class OnboardingAdminSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    designation = serializers.CharField(max_length=100, required=False, default="Admin")


class OnboardingBrandSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    contact_email = serializers.EmailField(required=False, default="")
    industry = serializers.CharField(max_length=100, required=False, default="")
    website = serializers.URLField(required=False, default="")
    description = serializers.CharField(required=False, default="")


class OnboardingCreatorSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, default="")


class ClientOnboardingSerializer(serializers.Serializer):
    # Step 1: Client details
    company_name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=100, required=False, allow_blank=True)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, default="")
    address = serializers.CharField(required=False, default="")
    industry = serializers.CharField(max_length=100, required=False, default="")

    # Step 2: T&C acceptance
    accepted_terms = serializers.BooleanField()

    # Step 3: Admin employee (mandatory)
    admin = OnboardingAdminSerializer()

    # Step 4: Brands (optional)
    brands = OnboardingBrandSerializer(many=True, required=False, default=[])

    # Step 5: Creators (optional)
    creators = OnboardingCreatorSerializer(many=True, required=False, default=[])

    def validate_accepted_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the Terms & Conditions.")
        return value

    def validate_slug(self, value):
        import re
        if value and not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", value):
            raise serializers.ValidationError("Slug must be lowercase alphanumeric with hyphens only.")
        reserved = {"www", "api", "admin", "app", "mail", "ftp", "static", "media"}
        if value in reserved:
            raise serializers.ValidationError(f"'{value}' is a reserved subdomain.")
        from apps.accounts.models import Client
        if value and Client.all_objects.filter(slug=value).exists():
            raise serializers.ValidationError("This slug is already taken.")
        return value

    def validate_admin(self, value):
        from apps.employees.models import Employee
        # Can't validate uniqueness fully here since client doesn't exist yet
        return value


class CollabIQTokenObtainSerializer(serializers.Serializer):
    """
    Domain-aware login serializer.
    - On naked domain (platform): authenticates against User model.
    - On subdomain (client): authenticates against Employee model.
    """
    email = serializers.CharField()  # Can be email or username for employees
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context.get("request")
        tenant_type = getattr(request, "tenant_type", "platform")
        identifier = attrs["email"]
        password = attrs["password"]

        if tenant_type == "client":
            return self._authenticate_employee(request, identifier, password)
        else:
            return self._authenticate_user(identifier, password)

    def _authenticate_user(self, email, password):
        """Authenticate Super Admin via User model."""
        from apps.accounts.models import User

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")

        if not user.is_superadmin:
            raise serializers.ValidationError("Access denied.")

        refresh = RefreshToken.for_user(user)
        refresh["is_superadmin"] = True
        refresh["actor_type"] = "user"

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "actor_type": "user",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
            },
        }

    def _authenticate_employee(self, request, identifier, password):
        """Authenticate Employee on client subdomain."""
        from apps.employees.models import Employee

        client = getattr(request, "client", None)
        if not client:
            raise serializers.ValidationError("Invalid client domain.")

        # Try email first, then username
        try:
            employee = Employee.objects.active().get(
                client=client,
                email=identifier,
            )
        except Employee.DoesNotExist:
            try:
                employee = Employee.objects.active().get(
                    client=client,
                    username=identifier,
                )
            except Employee.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")

        if not employee.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")

        refresh = RefreshToken()
        refresh["employee_id"] = employee.id
        refresh["client_id"] = client.id
        refresh["role_id"] = employee.role_id
        refresh["actor_type"] = "employee"

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "actor_type": "employee",
            "employee": {
                "id": employee.id,
                "email": employee.email,
                "username": employee.username,
                "full_name": employee.full_name,
                "role": employee.role.name,
            },
            "client": {
                "id": client.id,
                "company_name": client.company_name,
                "slug": client.slug,
            },
        }


# --- Super Admin Serializers ---

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.accounts.models import SubscriptionPlan
        model = SubscriptionPlan
        fields = [
            "id", "name", "tier", "max_brands", "max_creators", "max_campaigns",
            "max_employees", "price_monthly", "price_yearly", "features", "is_active",
        ]
        read_only_fields = ["id"]


class ClientListSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="subscription_plan.name", read_only=True)

    class Meta:
        from apps.accounts.models import Client
        model = Client
        fields = [
            "id", "company_name", "slug", "email", "phone", "subscription_plan",
            "plan_name", "is_active", "onboarded_at", "created_at",
        ]


class ClientDetailSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.accounts.models import Client
        model = Client
        fields = [
            "id", "company_name", "slug", "email", "phone", "address", "logo",
            "subscription_plan", "is_active", "onboarded_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        validated_data.pop("slug", None)
        return super().update(instance, validated_data)


class ClientSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.accounts.models import ClientSubscription
        model = ClientSubscription
        fields = [
            "id", "client", "plan", "status", "billing_cycle",
            "start_date", "end_date", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
