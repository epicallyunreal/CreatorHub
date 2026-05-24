from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.employees.views import EmployeeTagViewSet, EmployeeViewSet

router = SimpleRouter()
router.register("", EmployeeViewSet, basename="employee")

tag_router = SimpleRouter()
tag_router.register("tags", EmployeeTagViewSet, basename="employee-tag")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(tag_router.urls)),
]
