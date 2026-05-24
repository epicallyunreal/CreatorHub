"""
JWT Authentication backend for CollabIQ.
Resolves tokens to either User (Super Admin) or Employee based on token claims.
Attaches request.employee for client-side tokens.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class EmployeeUser:
    """
    Lightweight user-like wrapper so DRF treats employee-authenticated
    requests as authenticated (is_authenticated=True).
    This satisfies DEFAULT_PERMISSION_CLASSES=[IsAuthenticated].
    """

    is_authenticated = True
    is_active = True
    is_staff = False
    is_superuser = False

    def __init__(self, employee):
        self.employee = employee
        self.pk = employee.pk
        self.id = employee.pk

    def __str__(self):
        return str(self.employee)


class CollabIQJWTAuthentication(JWTAuthentication):
    """
    Custom JWT auth that handles both User and Employee tokens.
    - Tokens with actor_type=user → standard User authentication
    - Tokens with actor_type=employee → attaches request.employee
    """

    def authenticate(self, request):
        raw_token = self.get_raw_token(self.get_header(request))
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        actor_type = validated_token.get("actor_type", "user")

        if actor_type == "employee":
            return self._authenticate_employee(request, validated_token)
        else:
            return super().authenticate(request)

    def _authenticate_employee(self, request, validated_token):
        from apps.employees.models import Employee

        employee_id = validated_token.get("employee_id")
        client_id = validated_token.get("client_id")

        if not employee_id or not client_id:
            raise InvalidToken("Token missing employee or client claims.")

        try:
            employee = Employee.objects.active().select_related("role", "client").get(
                id=employee_id,
                client_id=client_id,
            )
        except Employee.DoesNotExist:
            raise InvalidToken("Employee not found or inactive.")

        # Verify the request's subdomain matches the token's client
        request_client = getattr(request, "client", None)
        if request_client and request_client.id != client_id:
            raise InvalidToken("Token does not match current domain.")

        # Set employee on request for downstream use
        request.employee = employee
        request.client = employee.client
        # Promote tenant_type to "client" — the token proves client context
        # even when the middleware couldn't detect a subdomain.
        request.tenant_type = "client"

        # Return EmployeeUser wrapper so DRF treats the request as authenticated
        return (EmployeeUser(employee), validated_token)

    def get_raw_token(self, header):
        if header is None:
            return None
        return super().get_raw_token(header)
