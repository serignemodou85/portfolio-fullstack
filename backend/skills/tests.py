from django.core.cache import caches
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from .models import Skill, SkillCategory


class SkillAPITests(TestCase):
    def setUp(self):
        caches['default'].clear()
        self.client = APIClient()
        self.admin = User.objects.create_user('admin', 'admin@example.com', 'x', is_staff=True)
        self.category = SkillCategory.objects.create(name='Data', icon='database', order=1)
        Skill.objects.create(name='Python', category=self.category, proficiency=3, created_by=self.admin)

    def test_categories_with_skills_are_public(self):
        response = self.client.get('/api/skill-categories/with_skills/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['skills'][0]['name'], 'Python')

    def test_anonymous_and_non_staff_cannot_write(self):
        self.assertEqual(self.client.post('/api/skill-categories/', {'name': 'X', 'order': 2}, format='json').status_code, 401)
        self.client.force_authenticate(User.objects.create_user('visitor', 'v@example.com', 'x'))
        self.assertEqual(self.client.post('/api/skill-categories/', {'name': 'X', 'order': 2}, format='json').status_code, 403)
