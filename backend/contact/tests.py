from datetime import timedelta
from io import StringIO

from django.core.cache import caches
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import ContactMessage

VALID = {
    'name': 'Jane Doe',
    'email': 'jane@example.com',
    'subject': 'Mission data',
    'message': 'Bonjour, je souhaite discuter d\'une mission.',
}


class ContactFormTests(TestCase):
    def setUp(self):
        caches['default'].clear()
        self.client = APIClient()

    def test_human_submission_is_saved_with_ip(self):
        response = self.client.post('/api/contact/', VALID, format='json', REMOTE_ADDR='203.0.113.7')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.get().ip_address, '203.0.113.7')

    def test_honeypot_submission_looks_successful_but_is_dropped(self):
        response = self.client.post('/api/contact/', {**VALID, 'website': 'http://spam.example'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertFalse(ContactMessage.objects.exists())

    def test_messages_are_not_readable_anonymously(self):
        ContactMessage.objects.create(**VALID)
        self.assertEqual(self.client.get('/api/contact/').status_code, 401)


class PurgePersonalDataTests(TestCase):
    def test_old_ips_are_erased_recent_ones_kept(self):
        old = ContactMessage.objects.create(**VALID, ip_address='203.0.113.1')
        recent = ContactMessage.objects.create(**VALID, ip_address='203.0.113.2')
        ContactMessage.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=31))

        call_command('purge_personal_data', stdout=StringIO())

        old.refresh_from_db()
        recent.refresh_from_db()
        self.assertIsNone(old.ip_address)
        self.assertEqual(recent.ip_address, '203.0.113.2')
        self.assertEqual(old.message, VALID['message'])
