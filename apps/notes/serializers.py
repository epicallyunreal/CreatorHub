from rest_framework import serializers

from apps.notes.models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id", "entity_type", "entity_id", "author", "author_name",
            "text", "context", "is_internal", "parent", "attachments", "replies",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.filter(is_active=True), many=True).data
        return []

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        validated_data["author"] = request.employee
        return super().create(validated_data)
