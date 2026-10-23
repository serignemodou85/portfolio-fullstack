"""
DJANGO_SETTINGS_MODULE reste `portfolio_backend.settings` : ce paquet choisit
l'environnement tout seul, donc rien à changer côté Render, wsgi ou manage.py.

DJANGO_ENV=production|development force le choix ; sinon la présence de la
variable RENDER (posée automatiquement par Render) signifie production.
"""
import os

from .base import *  # noqa: F401,F403  (charge aussi backend/.env)

DJANGO_ENV = (os.getenv('DJANGO_ENV') or ('production' if os.getenv('RENDER') else 'development')).strip().lower()

if DJANGO_ENV == 'production':
    from .production import *  # noqa: F401,F403
else:
    from .development import *  # noqa: F401,F403
