# accounts/audit.py
"""
Journal d'audit : événements d'authentification + modifications de contenu
faites par un utilisateur connecté (les visites anonymes ne sont pas tracées).
"""
import datetime
import decimal
import logging
import uuid

from django.apps import apps
from django.db import models
from django.db.models.signals import post_delete, post_save, pre_save

from portfolio_backend.middleware import get_current_request

logger = logging.getLogger(__name__)

AUDITED_MODELS = [
    'accounts.User',
    'projects.Project',
    'experience.Experience',
    'skills.SkillCategory',
    'skills.Skill',
    'blog.Category',
    'blog.Tag',
    'blog.Article',
    'contact.ContactMessage',
]

# Jamais de valeur en clair dans le journal : on note seulement que le champ a changé.
MASKED_FIELDS = {'password', 'phone', 'location', 'ip_address'}
# Bruit sans intérêt pour un audit (la 2FA a ses propres événements mfa_enabled/mfa_disabled).
IGNORED_FIELDS = {
    'updated_at', 'last_login', 'views', 'views_count',
    'totp_secret', 'totp_enabled', 'totp_backup_codes', 'totp_last_used_step',
}
MASK = '••••'


def client_ip(request):
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')
    return ip or None


def _user_agent(request):
    return (request.META.get('HTTP_USER_AGENT', '') if request else '')[:255]


def log_event(action, request=None, user=None, username='', changes=None, instance=None):
    AuditLog = apps.get_model('accounts', 'AuditLog')
    if user is None and request is not None:
        candidate = getattr(request, 'user', None)
        if candidate is not None and candidate.is_authenticated:
            user = candidate
    try:
        AuditLog.objects.create(
            user=user,
            username=(user.get_username() if user else username)[:150],
            action=action,
            model_name=instance._meta.label if instance is not None else '',
            object_id=str(instance.pk) if instance is not None and instance.pk is not None else '',
            object_repr=str(instance)[:255] if instance is not None else '',
            changes=changes or {},
            ip_address=client_ip(request),
            user_agent=_user_agent(request),
        )
    except Exception:
        # L'audit ne doit jamais faire échouer l'action métier elle-même.
        logger.exception('audit log write failed (%s)', action)


def _serializable(value):
    if isinstance(value, (datetime.date, datetime.datetime, datetime.time, decimal.Decimal, uuid.UUID)):
        return str(value)
    if isinstance(value, models.Model):
        return value.pk
    if hasattr(value, 'name') and hasattr(value, 'url'):  # fichiers / images
        return getattr(value, 'name', None) or None
    try:
        import json
        json.dumps(value)
        return value
    except TypeError:
        return str(value)


def _snapshot(instance):
    data = {}
    for field in instance._meta.concrete_fields:
        if field.name in IGNORED_FIELDS:
            continue
        data[field.name] = _serializable(getattr(instance, field.attname))
    return data


def _diff(old, new):
    changes = {}
    for name, new_value in new.items():
        old_value = old.get(name)
        if old_value == new_value:
            continue
        if name in MASKED_FIELDS:
            changes[name] = {'old': MASK, 'new': MASK}
        else:
            changes[name] = {'old': old_value, 'new': new_value}
    return changes


def _acting_request():
    request = get_current_request()
    user = getattr(request, 'user', None) if request is not None else None
    if user is None or not user.is_authenticated:
        return None
    return request


def _on_pre_save(sender, instance, raw=False, **kwargs):
    if raw or instance.pk is None or _acting_request() is None:
        return
    try:
        old = sender._default_manager.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    instance._audit_snapshot = _snapshot(old)


def _on_post_save(sender, instance, created, raw=False, update_fields=None, **kwargs):
    request = _acting_request()
    if raw or request is None:
        return
    new = _snapshot(instance)
    if created:
        changes = {k: (MASK if k in MASKED_FIELDS and v else v) for k, v in new.items()}
        log_event('create', request=request, changes=changes, instance=instance)
        return
    changes = _diff(getattr(instance, '_audit_snapshot', {}), new)
    if changes:
        log_event('update', request=request, changes=changes, instance=instance)


def _on_post_delete(sender, instance, **kwargs):
    request = _acting_request()
    if request is None:
        return
    log_event('delete', request=request, instance=instance)


def connect_audit_signals():
    for label in AUDITED_MODELS:
        model = apps.get_model(label)
        uid = f'audit-{label}'
        pre_save.connect(_on_pre_save, sender=model, dispatch_uid=f'{uid}-pre')
        post_save.connect(_on_post_save, sender=model, dispatch_uid=f'{uid}-post')
        post_delete.connect(_on_post_delete, sender=model, dispatch_uid=f'{uid}-del')
