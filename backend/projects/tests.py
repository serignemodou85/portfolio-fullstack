from datetime import date

from django.core.cache import caches
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from accounts.models import User
from .models import Project


def make_project(owner, n):
    return Project.objects.create(
        title=f'Projet {n}', slug=f'projet-{n}', description='Desc', technologies='Django, Angular',
        thumbnail='projects/thumbnails/x.jpg', start_date=date(2025, 1, 1), created_by=owner,
    )


class ProjectAPITests(TestCase):
    def setUp(self):
        caches['default'].clear()
        self.client = APIClient()
        self.admin = User.objects.create_user('admin', 'admin@example.com', 'x', is_staff=True)

    def test_anonymous_cannot_write(self):
        project = make_project(self.admin, 1)
        self.assertEqual(self.client.post('/api/projects/', {'title': 'x'}, format='json').status_code, 401)
        self.assertEqual(self.client.delete(f'/api/projects/{project.slug}/').status_code, 401)
        self.assertTrue(Project.objects.filter(pk=project.pk).exists())

    def test_non_staff_user_cannot_write(self):
        user = User.objects.create_user('visitor', 'v@example.com', 'x')
        self.client.force_authenticate(user)
        self.assertEqual(self.client.post('/api/projects/', {'title': 'x'}, format='json').status_code, 403)

    def test_list_query_count_does_not_grow_with_rows(self):
        self.client.force_authenticate(self.admin)
        make_project(self.admin, 1)
        with CaptureQueriesContext(connection) as small:
            self.client.get('/api/projects/')
        for n in range(2, 8):
            make_project(self.admin, n)
        with CaptureQueriesContext(connection) as large:
            self.client.get('/api/projects/')
        self.assertEqual(len(small), len(large))
