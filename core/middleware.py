from django.conf import settings
from django.http import JsonResponse


class TenantMiddleware:
    """
    Subdomain-based tenant resolution.

    - Parses the Host header to extract subdomain.
    - No subdomain (naked domain) → request.tenant_type = 'platform' (Super Admin context).
    - Subdomain present → looks up Client by slug → request.tenant_type = 'client'.
    - Sets request.client to the resolved Client instance (or None for platform).

    Skips tenant resolution for Django admin, static, and media URLs.
    """

    SKIP_PATHS = ("/admin/", "/static/", "/media/")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if any(request.path.startswith(p) for p in self.SKIP_PATHS):
            request.client = None
            request.tenant_type = "platform"
            return self.get_response(request)

        host = request.get_host().split(":")[0]  # Strip port
        base_domain = settings.BASE_DOMAIN.split(":")[0]

        subdomain = self._extract_subdomain(host, base_domain)

        if subdomain:
            client = self._resolve_client(subdomain)
            if client is None:
                return JsonResponse(
                    {"detail": "Invalid client domain."},
                    status=404,
                )
            if not client.is_active:
                return JsonResponse(
                    {"detail": "This client account is inactive."},
                    status=403,
                )
            request.client = client
            request.tenant_type = "client"
        else:
            request.client = None
            request.tenant_type = "platform"

        return self.get_response(request)

    def _extract_subdomain(self, host, base_domain):
        """Extract subdomain from host. Returns None if naked domain."""
        if host == base_domain:
            return None
        if host.endswith(f".{base_domain}"):
            subdomain = host[: -(len(base_domain) + 1)]
            if subdomain and "." not in subdomain:  # Only single-level subdomains
                return subdomain
        return None

    def _resolve_client(self, slug):
        """Look up active client by slug. Import here to avoid circular imports."""
        from apps.accounts.models import Client

        try:
            return Client.objects.get(slug=slug)
        except Client.DoesNotExist:
            return None
