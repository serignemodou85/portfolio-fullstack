# portfolio_backend/github.py
"""
Dépôts GitHub publics récents, servis par l'API plutôt qu'appelés depuis le navigateur :
cache d'une heure (limite GitHub de 60 requêtes/h sans jeton) et pas de domaine
supplémentaire à autoriser dans la CSP du frontend.
"""
import json
import logging
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)

CACHE_KEY = 'github:repos'
CACHE_SECONDS = 60 * 60
MAX_REPOS = 6


def _fetch_repos(username: str) -> list[dict]:
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-modou-fall'}
    if settings.GITHUB_TOKEN:
        headers['Authorization'] = f'Bearer {settings.GITHUB_TOKEN}'
    request = Request(
        f'https://api.github.com/users/{username}/repos?sort=pushed&per_page=100',
        headers=headers,
    )
    with urlopen(request, timeout=5) as response:
        repos = json.load(response)

    public = [r for r in repos if not r.get('fork') and not r.get('archived') and not r.get('private')]
    public.sort(key=lambda r: r.get('pushed_at') or '', reverse=True)
    return [
        {
            'name': r['name'],
            'description': r.get('description') or '',
            'url': r['html_url'],
            'language': r.get('language') or '',
            'stars': r.get('stargazers_count', 0),
            'forks': r.get('forks_count', 0),
            'topics': (r.get('topics') or [])[:4],
            'pushed_at': r.get('pushed_at'),
        }
        for r in public[:MAX_REPOS]
    ]


@api_view(['GET'])
@permission_classes([AllowAny])
def github_repos(request):
    username = settings.GITHUB_USERNAME
    data = cache.get(CACHE_KEY)
    if data is None:
        try:
            data = {'username': username, 'repos': _fetch_repos(username)}
        except (URLError, TimeoutError, ValueError, KeyError) as exc:
            # GitHub indisponible ou limite atteinte : la section est simplement masquée côté front.
            logger.warning('github repos fetch failed: %s', exc)
            return Response({'username': username, 'repos': []})
        cache.set(CACHE_KEY, data, CACHE_SECONDS)
    return Response(data)
