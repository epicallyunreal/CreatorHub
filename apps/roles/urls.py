from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.roles.views import PermissionViewSet, RoleViewSet

router = SimpleRouter()
router.register("roles", RoleViewSet, basename="role")
router.register("permissions", PermissionViewSet, basename="permission")

urlpatterns = [
    path("", include(router.urls)),
]
