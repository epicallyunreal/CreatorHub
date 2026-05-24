from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.notes.views import CommentViewSet

router = SimpleRouter()
router.register("", CommentViewSet, basename="comment")

urlpatterns = [
    path("", include(router.urls)),
]
