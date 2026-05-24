"""
Audit logging utility.

Usage in views/services:
    from apps.audit.utils import log_action

    log_action(
        request=request,
        action="create",
        entity=brand_instance,
        changes={"name": [None, "Acme Corp"]},
    )
"""


def get_client_ip(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(request, action, entity=None, entity_type=None, entity_id=None,
               entity_repr="", changes=None, metadata=None):
    """
    Create an audit log entry.

    Args:
        request: Django request (provides actor info and IP)
        action: AuditLog.Action value (create, update, void, etc.)
        entity: Optional model instance (auto-extracts type, id, repr)
        entity_type: Manual entity type string (if no entity passed)
        entity_id: Manual entity ID (if no entity passed)
        entity_repr: String representation of the entity
        changes: Dict of field changes {field: [old, new]}
        metadata: Extra context dict
    """
    from apps.audit.models import AuditLog

    # Determine actor
    employee = getattr(request, "employee", None)
    user = getattr(request, "user", None)

    if employee:
        actor_type = "employee"
        actor_id = employee.id
        actor_name = employee.full_name
        client = employee.client
    elif user and user.is_authenticated:
        actor_type = "user"
        actor_id = user.id
        actor_name = user.full_name
        client = getattr(request, "client", None)
    else:
        actor_type = "user"
        actor_id = 0
        actor_name = "System"
        client = getattr(request, "client", None)

    # Extract from entity if provided
    if entity:
        entity_type = entity_type or entity.__class__.__name__
        entity_id = entity_id or entity.pk
        entity_repr = entity_repr or str(entity)

    AuditLog.objects.create(
        client=client,
        actor_type=actor_type,
        actor_id=actor_id,
        actor_name=actor_name,
        action=action,
        entity_type=entity_type or "",
        entity_id=entity_id,
        entity_repr=entity_repr,
        changes=changes or {},
        metadata=metadata or {},
        ip_address=get_client_ip(request),
    )
