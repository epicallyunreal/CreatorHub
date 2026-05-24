from celery import shared_task

from apps.notifications.models import Notification


@shared_task
def send_notification(notification_id):
    """Send a notification via its configured channel."""
    try:
        notification = Notification.objects.get(pk=notification_id)
    except Notification.DoesNotExist:
        return

    if notification.channel == "in_app":
        # Already persisted; nothing to do.
        return

    # Placeholder hooks for external channels.
    if notification.channel == "email":
        _send_email(notification)
    elif notification.channel == "sms":
        _send_sms(notification)
    elif notification.channel == "whatsapp":
        _send_whatsapp(notification)

    notification.is_read = True
    notification.save(update_fields=["is_read"])


def _send_email(notification):
    """Placeholder: integrate with SendGrid / SES."""
    pass


def _send_sms(notification):
    """Placeholder: integrate with Twilio."""
    pass


def _send_whatsapp(notification):
    """Placeholder: integrate with Twilio / WhatsApp Business API."""
    pass


@shared_task
def send_bulk_notifications(notification_ids):
    """Fan-out helper for batch notifications."""
    for nid in notification_ids:
        send_notification.delay(nid)
