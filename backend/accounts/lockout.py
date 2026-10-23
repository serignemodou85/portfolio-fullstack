# accounts/lockout.py
"""Verrouillage d'un identifiant après trop d'échecs (mot de passe ou code 2FA)."""
from django.conf import settings
from django.core.cache import caches


def _cache():
    return caches['security']


def _key(identifier: str) -> str:
    return f'login-fail:{(identifier or "").strip().lower()}'


def is_locked(identifier: str) -> bool:
    return (_cache().get(_key(identifier)) or 0) >= settings.LOGIN_LOCKOUT_MAX_ATTEMPTS


def register_failure(identifier: str) -> int:
    key = _key(identifier)
    cache = _cache()
    # La fenêtre part du premier échec : elle n'est pas prolongée à chaque essai.
    cache.add(key, 0, timeout=settings.LOGIN_LOCKOUT_WINDOW_SECONDS)
    try:
        return cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=settings.LOGIN_LOCKOUT_WINDOW_SECONDS)
        return 1


def reset(identifier: str) -> None:
    _cache().delete(_key(identifier))
