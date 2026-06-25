# blog/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.views.decorators.cache import cache_page
from django.conf import settings
from django.db.models import Count, F, Q
from portfolio_backend.permissions import IsAdminOrReadOnly
from .models import Category, Tag, Article
from .serializers import (
    CategorySerializer,
    TagSerializer,
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les categories d'articles
    """
    queryset = Category.objects.annotate(
        articles_count=Count('articles', filter=Q(articles__status='published'))
    )
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les tags
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related('author', 'category').prefetch_related('tags')
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'is_featured']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'views_count']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs.order_by('-created_at')
        return qs.filter(status='published').order_by('-published_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateUpdateSerializer
        return ArticleDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not (request.user and request.user.is_authenticated and request.user.is_staff):
            Article.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
            instance.refresh_from_db(fields=['views_count'])
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Endpoint personnalise : /api/articles/featured/
        Retourne les articles mis en avant
        """
        if not (request.user and request.user.is_authenticated):
            return cache_page(settings.CACHE_TTL)(self._featured_impl)(request)
        return self._featured_impl(request)

    def _featured_impl(self, request):
        featured_articles = self.get_queryset().filter(is_featured=True)[:3]
        serializer = ArticleListSerializer(featured_articles, many=True)
        return Response(serializer.data)
