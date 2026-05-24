from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.brands.views import BrandContactViewSet, BrandViewSet

router = SimpleRouter()
router.register("", BrandViewSet, basename="brand")

brand_contacts = SimpleRouter()
brand_contacts.register("contacts", BrandContactViewSet, basename="brand-contact")

urlpatterns = [
    path("", include(router.urls)),
    path("<int:brand_pk>/", include(brand_contacts.urls)),
]
