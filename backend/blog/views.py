# blog/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
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
    ViewSet pour les catégories d'articles
    """
    queryset = Category.objects.all()
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
    """
    ViewSet pour les articles
    """
    queryset = Article.objects.select_related('author', 'category').prefetch_related('tags').filter(status='published').order_by('-published_at')
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'is_featured']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'views_count']
    
    def get_queryset(self):
        """
        Les admins voient tous les articles, les autres seulement les publiés
        """
        if self.request.user.is_staff:
            return Article.objects.select_related('author', 'category').prefetch_related('tags').all().order_by('-created_at')
        return Article.objects.select_related('author', 'category').prefetch_related('tags').filter(status='published').order_by('-published_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateUpdateSerializer
        return ArticleDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Incrémente le compteur de vues à chaque lecture
        """
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Endpoint personnalisé : /api/articles/featured/
        Retourne les articles mis en avant
        """
        featured_articles = self.get_queryset().filter(is_featured=True)[:3]
        serializer = ArticleListSerializer(featured_articles, many=True)
        return Response(serializer.data)
