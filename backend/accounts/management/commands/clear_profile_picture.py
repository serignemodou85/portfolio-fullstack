from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Vide le champ profile_picture corrompu du superuser"

    def handle(self, *args, **options):
        user = (
            User.objects.filter(is_superuser=True).first()
            or User.objects.filter(is_staff=True).first()
        )
        if not user:
            self.stderr.write("Aucun superuser trouvé.")
            return

        old_value = str(user.profile_picture) if user.profile_picture else "vide"
        user.profile_picture = None
        user.save(update_fields=["profile_picture"])
        self.stdout.write(
            self.style.SUCCESS(
                f"profile_picture vidé pour {user.username} (était: {old_value})"
            )
        )
