from pathlib import Path

from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from django.contrib.auth import get_user_model

from projects.models import Project
from experience.models import Experience
from blog.models import Article
from urllib.parse import urlparse


class Command(BaseCommand):
    help = "Migre les fichiers media locaux vers Cloudinary (re-sauvegarde les FileField)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Affiche ce qui serait migre sans uploader.")
        parser.add_argument(
            "--show-missing",
            action="store_true",
            help="Affiche la liste des champs dont le fichier local est introuvable.",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        show_missing = options.get("show_missing", False)
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
        already_remote = 0
        missing = 0
        missing_items = []

        for queryset, fields in targets:
            for obj in queryset:
                for field_name in fields:
                    field = getattr(obj, field_name, None)
                    if not field:
                        skipped += 1
                        continue
                    # Cloudinary resource or remote URL already
                    if field.__class__.__module__.startswith("cloudinary"):
                        already_remote += 1
                        continue

                    local_path = None
                    try:
                        local_path = Path(field.path)
                    except Exception:
                        local_path = None
                    if not local_path:
                        field_storage_name = getattr(field, "name", None)
                        if field_storage_name:
                            if isinstance(field_storage_name, str) and field_storage_name.startswith(("http://", "https://")):
                                already_remote += 1
                                continue
                            raw_name = field_storage_name
                            # strip MEDIA_URL or leading slash
                            media_url = (settings.MEDIA_URL or "").lstrip("/")
                            if raw_name.startswith("/"):
                                raw_name = raw_name[1:]
                            if media_url and raw_name.startswith(media_url):
                                raw_name = raw_name[len(media_url):].lstrip("/")
                            # absolute path
                            candidate = Path(raw_name)
                            if candidate.is_absolute() and candidate.exists():
                                local_path = candidate
                            else:
                                local_path = Path(settings.MEDIA_ROOT) / raw_name

                            # Fallback: try to resolve missing files by base name.
                            if not local_path.exists():
                                parent_dir = local_path.parent
                                name = local_path.name
                                candidates = []
                                if parent_dir.exists():
                                    # Try same name with any extension
                                    if "." not in name:
                                        candidates += list(parent_dir.glob(f"{name}.*"))
                                    # Try without trailing random suffix
                                    if "_" in name and "." not in name:
                                        base = name.rsplit("_", 1)[0]
                                        candidates += list(parent_dir.glob(f"{base}.*"))
                                    # Fallback: startswith base
                                    if "_" in name:
                                        base = name.rsplit("_", 1)[0]
                                        candidates += [p for p in parent_dir.iterdir() if p.is_file() and p.stem.startswith(base)]

                                if candidates:
                                    local_path = candidates[0]
                    if not local_path or not local_path.exists():
                        missing += 1
                        if show_missing:
                            field_storage_name = getattr(field, "name", None)
                            missing_items.append(
                                f"{obj.__class__.__name__}#{obj.pk}.{field_name} -> {field_storage_name}"
                            )
                        continue

                    if dry_run:
                        self.stdout.write(f"[DRY] {obj.__class__.__name__}#{obj.pk}.{field_name} -> {local_path}")
                        migrated += 1
                        continue

                    with local_path.open("rb") as fh:
                        field.save(local_path.name, File(fh), save=True)
                        migrated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Migration terminee. Migres: {migrated}, deja distants: {already_remote}, "
                f"fichiers manquants: {missing}, ignores: {skipped}"
            )
        )
        if show_missing and missing_items:
            self.stdout.write(self.style.WARNING("Fichiers manquants:"))
            for line in missing_items:
                self.stdout.write(f" - {line}")
