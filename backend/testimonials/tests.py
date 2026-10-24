from django.core.cache import caches
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from .models import Testimonial


class TestimonialAPITests(TestCase):
    def setUp(self):
        caches['default'].clear()
        self.client = APIClient()
        self.admin = User.objects.create_user('admin', 'admin@example.com', 'x', is_staff=True)
        Testimonial.objects.create(author_name='Publié', content='Très bon travail.', is_published=True)
        Testimonial.objects.create(author_name='Brouillon', content='Pas encore validé.')

    def names(self, response):
        data = response.data
        items = data['results'] if isinstance(data, dict) else data
        return [t['author_name'] for t in items]

    def test_public_sees_only_published(self):
        self.assertEqual(self.names(self.client.get('/api/testimonials/')), ['Publié'])

    def test_staff_sees_drafts_and_can_publish(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(sorted(self.names(self.client.get('/api/testimonials/'))), ['Brouillon', 'Publié'])
        draft = Testimonial.objects.get(author_name='Brouillon')
        response = self.client.patch(f'/api/testimonials/{draft.pk}/', {'is_published': True}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Testimonial.objects.get(pk=draft.pk).is_published)

    def test_anonymous_cannot_create(self):
        response = self.client.post('/api/testimonials/', {'author_name': 'X', 'content': 'Y'}, format='json')
        self.assertEqual(response.status_code, 401)
