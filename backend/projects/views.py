# projects/views.py
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from portfolio_backend.permissions import IsAdminOrReadOnly
from .models import Project
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les projets
    GET: Public (lecture seule)
    POST/PUT/DELETE: Authentification requise
    """
    queryset = Project.objects.select_related('created_by').all().order_by('-created_at')
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'  # Utilise le slug au lieu de l'ID dans l'URL
    
    # Filtres et recherche
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_featured']
    search_fields = ['title', 'description', 'technologies']
    ordering_fields = ['created_at', 'start_date', 'order']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer
    
    def perform_create(self, serializer):
        """
        Assigne automatiquement l'utilisateur connecté lors de la création
        """
        serializer.save(created_by=self.request.user)
