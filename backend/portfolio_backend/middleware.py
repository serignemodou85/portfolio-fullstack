# portfolio_backend/middleware.py
from contextvars import ContextVar

from django.conf import settings

_current_request: ContextVar = ContextVar('current_request', default=None)


def get_current_request():
    return _current_request.get()


class PermissionsPolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        policy = getattr(settings, 'PERMISSIONS_POLICY', '')
        if policy:
            response.setdefault('Permissions-Policy', policy)
        return response


class AuditRequestMiddleware:
    """Expose la requête courante aux signaux d'audit (qui n'y ont pas accès sinon)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = _current_request.set(request)
        try:
            return self.get_response(request)
        finally:
            _current_request.reset(token)
