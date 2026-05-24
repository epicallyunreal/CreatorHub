from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import ClientOnboardingView, LoginView

urlpatterns = [
    path("login/", LoginView.as_view(), name="token_obtain"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("onboard/", ClientOnboardingView.as_view(), name="client_onboard"),
]