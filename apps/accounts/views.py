from django.db import transaction
from django.db.models import Count, Sum
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Client, ClientSubscription, SubscriptionPlan
from apps.accounts.serializers import (
    ClientDetailSerializer,
    ClientListSerializer,
    ClientOnboardingSerializer,
    ClientSubscriptionSerializer,
    CollabIQTokenObtainSerializer,
    SubscriptionPlanSerializer,
)
from core.drf_permissions import IsSuperAdmin


class LoginView(APIView):
    """Domain-aware login: User on platform, Employee on subdomain."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CollabIQTokenObtainSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class ClientOnboardingView(APIView):
    """Public endpoint: full client onboarding pipeline."""
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = ClientOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Create client
        client = Client(
            company_name=data["company_name"],
            email=data["email"],
            phone=data.get("phone", ""),
            address=data.get("address", ""),
        )
        if data.get("slug"):
            client.slug = data["slug"]
        client.save()

        # 2. Seed default roles
        from apps.roles.services import seed_default_roles
        seed_default_roles(client)

        # 3. Get the Admin role
        from apps.roles.models import Role
        admin_role = Role.objects.get(client=client, name="Admin")

        # 4. Create admin employee
        from apps.employees.models import Employee
        admin_data = data["admin"]
        admin_employee = Employee(
            client=client,
            first_name=admin_data["first_name"],
            last_name=admin_data["last_name"],
            email=admin_data["email"],
            username=admin_data["email"],  # default username = email
            designation=admin_data.get("designation", "Admin"),
            role=admin_role,
        )
        admin_employee.set_password(admin_data["password"])
        admin_employee.save()

        # 5. Create brands (optional)
        from apps.brands.models import Brand
        created_brands = []
        for brand_data in data.get("brands", []):
            brand = Brand.objects.create(
                client=client,
                name=brand_data["name"],
                contact_email=brand_data.get("contact_email", ""),
                industry=brand_data.get("industry", ""),
                website=brand_data.get("website", ""),
                description=brand_data.get("description", ""),
                created_by=admin_employee,
            )
            created_brands.append({"id": brand.id, "name": brand.name})

        # 6. Create creators (optional)
        from apps.creators.models import Creator
        created_creators = []
        for creator_data in data.get("creators", []):
            creator = Creator.objects.create(
                client=client,
                name=creator_data["name"],
                email=creator_data["email"],
                phone=creator_data.get("phone", ""),
                created_by=admin_employee,
            )
            created_creators.append({"id": creator.id, "name": creator.name})

        # 7. Generate JWT tokens for the new admin employee
        refresh = RefreshToken()
        refresh["employee_id"] = admin_employee.id
        refresh["client_id"] = client.id
        refresh["role_id"] = admin_role.id
        refresh["actor_type"] = "employee"

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "actor_type": "employee",
            "client": {
                "id": client.id,
                "company_name": client.company_name,
                "slug": client.slug,
            },
            "employee": {
                "id": admin_employee.id,
                "email": admin_employee.email,
                "full_name": admin_employee.full_name,
                "role": admin_role.name,
            },
            "brands_created": len(created_brands),
            "creators_created": len(created_creators),
        }, status=status.HTTP_201_CREATED)


# --- Super Admin APIs ---

class ClientViewSet(viewsets.ModelViewSet):
    """Super Admin: manage client companies."""
    permission_classes = [IsSuperAdmin]
    search_fields = ["company_name", "email"]
    filterset_fields = ["is_active"]

    def get_queryset(self):
        return Client.objects.all().select_related("subscription_plan")

    def get_serializer_class(self):
        if self.action == "list":
            return ClientListSerializer
        return ClientDetailSerializer


class ClientStatsView(APIView):
    """Aggregate counts only — no PII."""
    permission_classes = [IsSuperAdmin]

    def get(self, request, pk):
        try:
            client = Client.objects.get(pk=pk)
        except Client.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        from apps.brands.models import Brand
        from apps.campaigns.models import Campaign
        from apps.creators.models import Creator
        from apps.employees.models import Employee
        from apps.payouts.models import Payout

        data = {
            "client_id": client.id,
            "company_name": client.company_name,
            "brands_count": Brand.objects.active().filter(client=client).count(),
            "creators_count": Creator.objects.active().filter(client=client).count(),
            "campaigns_count": Campaign.objects.active().filter(client=client).count(),
            "employees_count": Employee.objects.active().filter(client=client).count(),
            "total_spend": (
                Payout.objects.filter(
                    payout_config__campaign_creator__campaign__client=client,
                    status="paid",
                ).aggregate(total=Sum("amount"))["total"] or 0
            ),
        }
        return Response(data)


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """Super Admin: manage subscription plans."""
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsSuperAdmin]
    queryset = SubscriptionPlan.objects.all()


class ClientSubscriptionViewSet(viewsets.ModelViewSet):
    """Super Admin: manage client subscriptions."""
    serializer_class = ClientSubscriptionSerializer
    permission_classes = [IsSuperAdmin]
    queryset = ClientSubscription.objects.all().select_related("client", "plan")


class PlatformStatsView(APIView):
    """Super Admin: platform-wide aggregate analytics."""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        data = {
            "total_clients": Client.objects.filter(is_active=True).count(),
            "total_clients_all": Client.objects.count(),
        }
        return Response(data)
