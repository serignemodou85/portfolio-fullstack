# experience/views.py
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from portfolio_backend.permissions import IsAdminOrReadOnly
from .models import Experience
from .serializers import ExperienceSerializer, ExperienceCreateUpdateSerializer

class ExperienceViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les expériences
    """
    queryset = Experience.objects.select_related('created_by').all().order_by('-start_date')
    permission_classes = [IsAdminOrReadOnly]
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'is_current']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExperienceCreateUpdateSerializer
        return ExperienceSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
