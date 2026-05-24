from rest_framework import viewsets

from apps.notes.models import Comment
from apps.notes.serializers import CommentSerializer
from core.drf_permissions import IsEmployee


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        qs = Comment.objects.active().filter(
            client=self.request.client, parent__isnull=True,
        ).select_related("author").prefetch_related("replies")
        entity_type = self.request.query_params.get("entity_type")
        entity_id = self.request.query_params.get("entity_id")
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        return qs
