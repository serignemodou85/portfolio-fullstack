from django.core.cache import caches
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from .models import Article, Category, Tag


class ArticleAPITests(TestCase):
    def setUp(self):
        caches['default'].clear()
        self.client = APIClient()
        self.author = User.objects.create_user('admin', 'admin@example.com', 'x', is_staff=True)
        self.category = Category.objects.create(name='Data')
        self.tags = [Tag.objects.create(name=f'tag{i}') for i in range(3)]

    def make_article(self, n, status='published'):
        article = Article.objects.create(
            title=f'Article {n}', slug=f'article-{n}', excerpt='Résumé', content='Contenu',
            featured_image='blog/featured/x.jpg', category=self.category, author=self.author,
            status=status, published_at=timezone.now(),
        )
        article.tags.set(self.tags)
        return article

    def test_drafts_are_hidden_from_public(self):
        self.make_article(1)
        self.make_article(2, status='draft')
        response = self.client.get('/api/blog/articles/')
        self.assertEqual([a['slug'] for a in response.data['results']], ['article-1'])
        self.assertEqual(self.client.get('/api/blog/articles/article-2/').status_code, 404)

    def test_list_query_count_does_not_grow_with_rows(self):
        self.client.force_authenticate(self.author)
        self.make_article(1)
        with CaptureQueriesContext(connection) as small:
            self.client.get('/api/blog/articles/')
        for n in range(2, 8):
            self.make_article(n)
        with CaptureQueriesContext(connection) as large:
            self.client.get('/api/blog/articles/')
        self.assertEqual(len(small), len(large))
