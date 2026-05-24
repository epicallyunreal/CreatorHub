from apps.audit.utils import log_action


class AuditMixin:
    """
    Mixin for ModelViewSet to auto-log create, update, and delete actions.
    """

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request, "create", entity=instance)
        return instance

    def perform_update(self, serializer):
        old_data = {f: getattr(serializer.instance, f) for f in serializer.validated_data}
        instance = serializer.save()
        changes = {}
        for field, old_val in old_data.items():
            new_val = getattr(instance, field)
            if str(old_val) != str(new_val):
                changes[field] = [str(old_val), str(new_val)]
        if changes:
            log_action(self.request, "update", entity=instance, changes=changes)
        return instance

    def perform_destroy(self, instance):
        instance.void()
        log_action(self.request, "void", entity=instance)
