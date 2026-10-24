import io
import json
from datetime import date
from unittest.mock import patch
from urllib.error import URLError

from django.core.cache import caches
from django.test import TestCase, override_settings
from django.utils import timezone

from accounts.models import User
from blog.models import Article
from projects.models import Project


def fake_github_response(repos):
    class Resp(io.BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    return Resp(json.dumps(repos).encode())


class GithubReposTests(TestCase):
    def setUp(self):
        caches['default'].clear()

    @patch('portfolio_backend.github.urlopen')
    def test_returns_recent_own_repos_and_caches_them(self, urlopen):
        urlopen.return_value = fake_github_response([
            {'name': 'old', 'html_url': 'u1', 'pushed_at': '2026-01-01T00:00:00Z', 'fork': False},
            {'name': 'forked', 'html_url': 'u2', 'pushed_at': '2026-09-01T00:00:00Z', 'fork': True},
            {'name': 'recent', 'html_url': 'u3', 'pushed_at': '2026-10-01T00:00:00Z', 'fork': False,
             'language': 'Python', 'stargazers_count': 3},
        ])
        first = self.client.get('/api/github/repos/').json()
        self.assertEqual([r['name'] for r in first['repos']], ['recent', 'old'])
        self.assertEqual(first['repos'][0]['stars'], 3)

        self.client.get('/api/github/repos/')
        self.assertEqual(urlopen.call_count, 1)

    @patch('portfolio_backend.github.urlopen', side_effect=URLError('down'))
    def test_github_outage_returns_empty_list(self, _):
        response = self.client.get('/api/github/repos/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['repos'], [])


@override_settings(SITE_URL='https://portfolio.example')
class SitemapTests(TestCase):
    def setUp(self):
        caches['default'].clear()
        author = User.objects.create_user('admin', 'admin@example.com', 'x', is_staff=True)
        common = dict(description='d', technologies='Django', thumbnail='x.jpg', start_date=date(2025, 1, 1), created_by=author)
        Project.objects.create(title='Live', slug='live', **common)
        Project.objects.create(title='Old', slug='old', status='archived', **common)
        art = dict(excerpt='e', content='c', featured_image='x.jpg', author=author, published_at=timezone.now())
        Article.objects.create(title='Pub', slug='pub', status='published', **art)
        Article.objects.create(title='Draft', slug='draft', status='draft', **art)

    def test_lists_pages_live_projects_and_published_articles_only(self):
        response = self.client.get('/sitemap.xml')
        self.assertEqual(response['Content-Type'], 'application/xml')
        body = response.content.decode()
        self.assertIn('<loc>https://portfolio.example/</loc>', body)
        self.assertIn('<loc>https://portfolio.example/projects/live</loc>', body)
        self.assertIn('<loc>https://portfolio.example/blog/pub</loc>', body)
        self.assertNotIn('/projects/old', body)
        self.assertNotIn('/blog/draft', body)
