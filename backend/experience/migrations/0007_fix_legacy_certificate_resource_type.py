# experience/migrations/0007_fix_legacy_certificate_resource_type.py
"""
Les certificats envoyés du temps de l'ancien ImageField sont stockés chez Cloudinary
en type "image", et en base sous forme d'un simple public_id (sans préfixe).
Depuis le passage à CloudinaryField(resource_type='raw'), ces valeurs sans préfixe
sont interprétées comme "raw" : l'URL générée pointe vers /raw/upload/... -> 404.

On rend le type explicite ("image/upload/<public_id>") pour ces valeurs historiques.
Les valeurs déjà préfixées (raw/..., image/..., video/...) ne sont pas touchées.
"""
from django.db import migrations

PREFIXES = ('raw/', 'image/', 'video/')


def add_image_prefix(apps, schema_editor):
    Experience = apps.get_model('experience', 'Experience')
    table = Experience._meta.db_table
    conn = schema_editor.connection
    with conn.cursor() as cursor:
        cursor.execute(
            f"SELECT id, certificate_file FROM {conn.ops.quote_name(table)} "
            f"WHERE certificate_file IS NOT NULL AND certificate_file <> ''"
        )
        rows = cursor.fetchall()
        for pk, value in rows:
            if value.startswith(PREFIXES) or value.startswith(('http://', 'https://')):
                continue
            cursor.execute(
                f"UPDATE {conn.ops.quote_name(table)} SET certificate_file = %s WHERE id = %s",
                [f'image/upload/{value}', pk],
            )


def remove_image_prefix(apps, schema_editor):
    Experience = apps.get_model('experience', 'Experience')
    table = Experience._meta.db_table
    conn = schema_editor.connection
    with conn.cursor() as cursor:
        cursor.execute(
            f"SELECT id, certificate_file FROM {conn.ops.quote_name(table)} "
            f"WHERE certificate_file LIKE 'image/upload/%%'"
        )
        for pk, value in cursor.fetchall():
            rest = value[len('image/upload/'):]
            # Ne retire le préfixe que des valeurs historiques (sans numéro de version).
            if not rest.startswith('v') or not rest.split('/', 1)[0][1:].isdigit():
                cursor.execute(
                    f"UPDATE {conn.ops.quote_name(table)} SET certificate_file = %s WHERE id = %s",
                    [rest, pk],
                )


class Migration(migrations.Migration):

    dependencies = [
        ('experience', '0006_alter_certificate_file_to_cloudinaryfield_raw'),
    ]

    operations = [
        migrations.RunPython(add_image_prefix, remove_image_prefix),
    ]
