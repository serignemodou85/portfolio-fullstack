"""
Liste (et supprime sur demande) les fichiers Cloudinary qu'aucun enregistrement ne référence.

    python manage.py cloudinary_orphans            # simulation : affiche la liste
    python manage.py cloudinary_orphans --delete   # supprime réellement

À lancer sur l'environnement dont la base pointe vers ce compte Cloudinary (la prod) :
contre une autre base, des fichiers utilisés seraient vus comme orphelins.
"""
from django.apps import apps
from django.core.management.base import BaseCommand
from django.db.models import FileField

RESOURCE_PREFIXES = ('image/upload/', 'raw/upload/', 'video/upload/')


def _normalize(name: str) -> str:
    for prefix in RESOURCE_PREFIXES:
        if name.startswith(prefix):
            name = name[len(prefix):]
    head, _, rest = name.partition('/')
    if rest and head.startswith('v') and head[1:].isdigit():
        name = rest
    return name.rsplit('.', 1)[0]


class Command(BaseCommand):
    help = 'Liste ou supprime les fichiers Cloudinary non référencés en base.'

    def add_arguments(self, parser):
        parser.add_argument('--delete', action='store_true', help='Supprime réellement les orphelins.')

    def handle(self, *args, **options):
        import cloudinary.api

        referenced = set()
        for model in apps.get_models():
            fields = [f for f in model._meta.get_fields() if isinstance(f, FileField)]
            if not fields:
                continue
            for obj in model.objects.all().only(*[f.name for f in fields]):
                for field in fields:
                    value = getattr(obj, field.name)
                    name = getattr(value, 'public_id', None) or getattr(value, 'name', None)
                    if name:
                        referenced.add(_normalize(str(name)))

        orphans = []
        for resource_type in ('image', 'raw'):
            cursor = None
            while True:
                page = cloudinary.api.resources(
                    resource_type=resource_type, type='upload', max_results=500, next_cursor=cursor
                )
                for res in page['resources']:
                    if _normalize(res['public_id']) not in referenced:
                        orphans.append((resource_type, res['public_id'], res.get('bytes', 0)))
                cursor = page.get('next_cursor')
                if not cursor:
                    break

        size_mb = sum(o[2] for o in orphans) / 1e6
        self.stdout.write(f'{len(referenced)} fichiers référencés, {len(orphans)} orphelins ({size_mb:.1f} Mo).')
        for resource_type, public_id, size in orphans:
            self.stdout.write(f'  [{resource_type}] {public_id} ({size / 1e3:.0f} Ko)')

        if not options['delete']:
            self.stdout.write(self.style.WARNING('Simulation : rien n\'a été supprimé (ajoutez --delete).'))
            return

        for resource_type in ('image', 'raw'):
            ids = [o[1] for o in orphans if o[0] == resource_type]
            for start in range(0, len(ids), 100):
                cloudinary.api.delete_resources(ids[start:start + 100], resource_type=resource_type)
        self.stdout.write(self.style.SUCCESS(f'{len(orphans)} fichiers supprimés.'))
