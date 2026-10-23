# accounts/management/commands/purge_personal_data.py
"""
Applique les durées de conservation RGPD :
- efface l'adresse IP des messages de contact plus vieux que CONTACT_IP_RETENTION_DAYS ;
- supprime les entrées du journal d'audit plus vieilles que AUDIT_LOG_RETENTION_DAYS.

Lancée à chaque déploiement (build.sh) ; à planifier aussi en tâche cron quotidienne.
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import AuditLog
from contact.models import ContactMessage


class Command(BaseCommand):
    help = "Purge les données personnelles arrivées en fin de durée de conservation."

    def handle(self, *args, **options):
        now = timezone.now()

        ip_cutoff = now - timedelta(days=settings.CONTACT_IP_RETENTION_DAYS)
        ips = (ContactMessage.objects
               .filter(created_at__lt=ip_cutoff, ip_address__isnull=False)
               .update(ip_address=None))

        audit_cutoff = now - timedelta(days=settings.AUDIT_LOG_RETENTION_DAYS)
        logs, _ = AuditLog.objects.filter(created_at__lt=audit_cutoff).delete()

        self.stdout.write(self.style.SUCCESS(
            f"IP de contact effacées : {ips} · entrées d'audit supprimées : {logs}"
        ))
