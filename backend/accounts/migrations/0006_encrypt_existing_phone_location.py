# accounts/migrations/0006_encrypt_existing_phone_location.py
"""
Chiffre les valeurs phone/location déjà présentes en base (créées avant que
ces champs deviennent des EncryptedTextField). Sans cette migration de
données, seules les futures écritures seraient chiffrées.
"""
from django.db import migrations


def encrypt_existing(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        changed_fields = []
        if user.phone:
            changed_fields.append('phone')
        if user.location:
            changed_fields.append('location')
        if changed_fields:
            user.save(update_fields=changed_fields)


def noop_reverse(apps, schema_editor):
    # Le déchiffrement inverse n'est pas nécessaire : EncryptedTextField
    # sait lire une valeur en clair (fallback dans from_db_value), donc
    # revenir en arrière ne casse rien même si les données restent chiffrées.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_user_location_alter_user_phone'),
    ]

    operations = [
        migrations.RunPython(encrypt_existing, noop_reverse),
    ]
