from django.core.management.base import BaseCommand

from apps.accounts.models import Client
from apps.roles.services import seed_default_roles


class Command(BaseCommand):
    help = "Seed default roles for a specific client or all clients missing them."

    def add_arguments(self, parser):
        parser.add_argument(
            "--client-id",
            type=int,
            help="Seed default roles for a specific client ID.",
        )

    def handle(self, *args, **options):
        client_id = options.get("client_id")

        if client_id:
            try:
                client = Client.objects.get(pk=client_id)
            except Client.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"Client {client_id} not found."))
                return
            count = seed_default_roles(client)
            self.stdout.write(
                self.style.SUCCESS(f"Seeded {count} default roles for '{client}'.")
            )
        else:
            total = 0
            for client in Client.objects.active():
                count = seed_default_roles(client)
                total += count
                if count:
                    self.stdout.write(f"  Seeded {count} roles for '{client}'")
            self.stdout.write(
                self.style.SUCCESS(f"Done. {total} roles seeded across all clients.")
            )
