from django.core.management.base import BaseCommand

from apps.configurations.models import AdFormat, Platform

# Global platforms and their ad formats
GLOBAL_PLATFORMS = {
    "YouTube": {
        "icon": "youtube",
        "base_url": "https://youtube.com",
        "ad_formats": ["Shorts", "Post", "Videos"],
    },
    "Instagram": {
        "icon": "instagram",
        "base_url": "https://instagram.com",
        "ad_formats": ["Story", "Post", "Reel"],
    },
    "WhatsApp": {
        "icon": "whatsapp",
        "base_url": "https://whatsapp.com",
        "ad_formats": ["Status"],
    },
}


class Command(BaseCommand):
    help = "Seed global (non-editable) platforms and their ad formats."

    def handle(self, *args, **options):
        p_created = 0
        af_created = 0

        for name, info in GLOBAL_PLATFORMS.items():
            platform, created = Platform.objects.get_or_create(
                name=name,
                client=None,
                defaults={"icon": info["icon"], "base_url": info["base_url"]},
            )
            if created:
                p_created += 1

            for fmt_name in info["ad_formats"]:
                _, fmt_created = AdFormat.objects.get_or_create(
                    name=fmt_name,
                    platform=platform,
                    client=None,
                    defaults={"description": ""},
                )
                if fmt_created:
                    af_created += 1

        total_p = Platform.objects.filter(client__isnull=True).count()
        total_af = AdFormat.objects.filter(client__isnull=True).count()
        self.stdout.write(
            f"Platforms seeded: {p_created} created, {total_p} global total. "
            f"Ad formats seeded: {af_created} created, {total_af} global total."
        )
