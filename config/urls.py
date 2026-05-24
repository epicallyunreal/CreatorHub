"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.accounts.views import ClientStatsView, PlatformStatsView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth (domain-aware — works on both naked domain and subdomains)
    path("api/v1/auth/", include("apps.accounts.urls")),

    # --- Client APIs (subdomain: {slug}.collabiq.com) ---
    path("api/v1/employees/", include("apps.employees.urls")),
    path("api/v1/", include("apps.roles.urls")),  # roles/ + permissions/
    path("api/v1/brands/", include("apps.brands.urls")),
    path("api/v1/creators/", include("apps.creators.urls")),
    path("api/v1/campaigns/", include("apps.campaigns.urls")),
    path("api/v1/payouts/", include("apps.payouts.urls")),
    path("api/v1/config/", include("apps.configurations.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
    path("api/v1/audit/", include("apps.audit.urls")),
    path("api/v1/notes/", include("apps.notes.urls")),

    # --- Super Admin APIs (naked domain: collabiq.com) ---
    path("api/v1/admin/clients/", include("apps.accounts.admin_urls")),
    path("api/v1/admin/clients/<int:pk>/stats/", ClientStatsView.as_view(), name="client-stats"),
    path("api/v1/admin/plans/", include("apps.accounts.plan_urls")),
    path("api/v1/admin/subscriptions/", include("apps.accounts.subscription_urls")),
    path("api/v1/admin/platform-stats/", PlatformStatsView.as_view(), name="platform-stats"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
