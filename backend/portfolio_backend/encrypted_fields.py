# portfolio_backend/encrypted_fields.py
"""
Champ Django chiffrant sa valeur au repos (at-rest) avec Fernet (AES-128-CBC + HMAC).

Le chiffrement Fernet est non déterministe (IV aléatoire à chaque appel) : deux
valeurs identiques produisent un ciphertext différent. C'est volontaire et sûr
pour des champs jamais utilisés en recherche exacte (téléphone, adresse...),
mais NE PAS l'utiliser sur un champ interrogé par égalité (ex: email de login),
sous peine de casser les lookups `.filter(champ=...)`.
"""
from functools import lru_cache

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import models
from cryptography.fernet import Fernet, InvalidToken


@lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
    if not key:
        raise ImproperlyConfigured(
            "FIELD_ENCRYPTION_KEY est obligatoire pour chiffrer les champs sensibles. "
            "Génère-en une avec: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


class EncryptedTextField(models.TextField):
    """
    TextField dont la valeur est chiffrée en base et déchiffrée transparentement
    à la lecture. Une valeur vide/None n'est jamais chiffrée (évite un ciphertext
    inutile et garde `blank=True` cohérent).
    """

    description = "Texte chiffré au repos (Fernet)"

    def get_prep_value(self, value):
        if value is None or value == '':
            return value
        value = str(value)
        # Idempotence: si la valeur est déjà un token Fernet valide (ex: resave
        # sans modification), on ne la re-chiffre pas.
        if self._looks_encrypted(value):
            return value
        token = _get_fernet().encrypt(value.encode('utf-8'))
        return token.decode('utf-8')

    def from_db_value(self, value, expression, connection):
        if value is None or value == '':
            return value
        try:
            return _get_fernet().decrypt(value.encode('utf-8')).decode('utf-8')
        except (InvalidToken, ValueError):
            # Valeur pré-existante non chiffrée (avant migration) : on la
            # renvoie telle quelle plutôt que de planter l'affichage.
            return value

    @staticmethod
    def _looks_encrypted(value: str) -> bool:
        try:
            _get_fernet().decrypt(value.encode('utf-8'))
            return True
        except Exception:
            return False
