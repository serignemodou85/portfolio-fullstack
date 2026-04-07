from pathlib import Path

from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from django.contrib.auth import get_user_model

from projects.models import Project
from experience.models import Experience
from blog.models import Article


class Command(BaseCommand):
    help = "Migre les fichiers media locaux vers Cloudinary (re-sauvegarde les FileField)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Affiche ce qui serait migre sans uploader.")

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        storage_name = getattr(settings, "DEFAULT_FILE_STORAGE", "")
        if "cloudinary_storage" not in storage_name:
            self.stdout.write(
                self.style.WARNING(
                    "DEFAULT_FILE_STORAGE n'est pas Cloudinary. "
                    "Configure d'abord CLOUDINARY_* dans l'environnement."
                )
            )
            if not dry_run:
                return

        User = get_user_model()

        targets = [
            (Project.objects.all(), ["thumbnail", "image_1", "image_2", "image_3"]),
            (Experience.objects.all(), ["company_logo", "certificate_file"]),
            (Article.objects.all(), ["featured_image"]),
            (User.objects.all(), ["profile_picture"]),
        ]

        migrated = 0
        skipped = 0

        for queryset, fields in targets:
            for obj in queryset:
                for field_name in fields:
                    field = getattr(obj, field_name, None)
                    if not field:
                        skipped += 1
                        continue
                    local_path = None
                    try:
                        local_path = Path(field.path)
                    except Exception:
                        local_path = None
                    if not local_path:
                        if field.name:
                            local_path = Path(settings.MEDIA_ROOT) / field.name
                    if not local_path.exists():
                        skipped += 1
                        continue

                    if dry_run:
                        self.stdout.write(f"[DRY] {obj.__class__.__name__}#{obj.pk}.{field_name} -> {local_path}")
                        migrated += 1
                        continue

                    with local_path.open("rb") as fh:
                        field.save(local_path.name, File(fh), save=True)
                        migrated += 1

        self.stdout.write(self.style.SUCCESS(f"Migration terminee. Migres: {migrated}, ignores: {skipped}"))
