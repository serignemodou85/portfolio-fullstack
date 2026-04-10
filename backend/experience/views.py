# experience/views.py
from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS
from django_filters.rest_framework import DjangoFilterBackend
from portfolio_backend.permissions import IsAdminOrReadOnly
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.conf import settings
from .models import Experience
from .serializers import ExperienceSerializer, ExperienceCreateUpdateSerializer

class ExperienceViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les expériences
    """
    queryset = Experience.objects.all().order_by('-start_date')
    permission_classes = [IsAdminOrReadOnly]
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'is_current']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExperienceCreateUpdateSerializer
        return ExperienceSerializer

    def get_authenticators(self):
        if self.request.method in SAFE_METHODS:
            return []
        return super().get_authenticators()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        if request.user and request.user.is_authenticated:
            return super().list(request, *args, **kwargs)
        return cache_page(settings.CACHE_TTL)(super().list)(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if request.user and request.user.is_authenticated:
            return super().retrieve(request, *args, **kwargs)
        return cache_page(settings.CACHE_TTL)(super().retrieve)(request, *args, **kwargs)
