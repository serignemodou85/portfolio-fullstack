# contact/views.py
import logging

from django.conf import settings

logger = logging.getLogger(__name__)
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .email_utils import (
    send_admin_notification,
    send_client_acknowledgement,
    send_manual_reply,
)
from .models import ContactMessage
from .serializers import ContactMessageSerializer, ContactMessageCreateSerializer


class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les messages de contact
    POST: Public
    GET/PUT/DELETE + actions: Admin uniquement
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return ContactMessageCreateSerializer
        return ContactMessageSerializer

    def get_permissions(self):
        """
        Creation publique, le reste admin staff
        """
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]

    def get_throttles(self):
        if self.action == 'create':
            self.throttle_scope = 'contact_create'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        """
        Enregistre l'IP de l'expediteur + envoie les notifications email.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')

        contact_message = serializer.save(ip_address=ip)

        notification_errors = []
        warning_codes = []

        smtp_configured = bool(settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD)
        if not smtp_configured:
            warning_codes.append('smtp_not_configured')

        if not (getattr(settings, 'CONTACT_ADMIN_EMAILS', []) or settings.EMAIL_HOST_USER):
            warning_codes.append('admin_recipients_missing')

        if smtp_configured:
            try:
                send_client_acknowledgement(contact_message)
            except Exception:
                logger.error('auto_reply failed for contact #%s', contact_message.pk, exc_info=True)
                notification_errors.append('auto_reply_failed')

            try:
                send_admin_notification(contact_message)
            except Exception:
                logger.error('admin_notification failed for contact #%s', contact_message.pk, exc_info=True)
                notification_errors.append('admin_notification_failed')

        response_data = serializer.data
        if warning_codes or notification_errors:
            response_data = {
                **response_data,
                'email_warning': 'Message enregistre, mais les notifications email ne sont pas completement configurees.',
                'email_warning_codes': warning_codes + notification_errors
            }

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_read(self, request, pk=None):
        contact_message = self.get_object()

        if contact_message.status == 'new':
            contact_message.status = 'read'
            contact_message.read_at = timezone.now()
            contact_message.save(update_fields=['status', 'read_at'])

        return Response({'status': contact_message.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def archive(self, request, pk=None):
        contact_message = self.get_object()
        contact_message.status = 'archived'

        if not contact_message.read_at:
            contact_message.read_at = timezone.now()
            contact_message.save(update_fields=['status', 'read_at'])
        else:
            contact_message.save(update_fields=['status'])

        return Response({'status': contact_message.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def restore(self, request, pk=None):
        contact_message = self.get_object()
        contact_message.status = 'read'

        if not contact_message.read_at:
            contact_message.read_at = timezone.now()
            contact_message.save(update_fields=['status', 'read_at'])
        else:
            contact_message.save(update_fields=['status'])

        return Response({'status': contact_message.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reply(self, request, pk=None):
        contact_message = self.get_object()
        reply_message = (request.data.get('reply_message') or '').strip()

        if not reply_message:
            return Response(
                {'reply_message': ['Le champ reply_message est requis.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        send_manual_reply(contact_message, reply_message)

        contact_message.status = 'replied'
        if not contact_message.read_at:
            contact_message.read_at = timezone.now()
            contact_message.save(update_fields=['status', 'read_at'])
        else:
            contact_message.save(update_fields=['status'])

        return Response(
            {'status': contact_message.status, 'detail': 'Réponse envoyée.'},
            status=status.HTTP_200_OK,
        )
