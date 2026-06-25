# projects/views.py
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from django.views.decorators.cache import cache_page
from django.conf import settings

from portfolio_backend.permissions import IsAdminOrReadOnly
from .models import Project
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related('created_by').all().order_by('-created_at')
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_featured']
    search_fields = ['title', 'description', 'technologies']
    ordering_fields = ['created_at', 'start_date', 'order']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not (request.user and request.user.is_authenticated and request.user.is_staff):
            Project.objects.filter(pk=instance.pk).update(views=F('views') + 1)
            instance.refresh_from_db(fields=['views'])
        return Response(self.get_serializer(instance).data)

    def list(self, request, *args, **kwargs):
        if request.user and request.user.is_authenticated:
            return super().list(request, *args, **kwargs)
        return cache_page(settings.CACHE_TTL)(super().list)(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def restore(self, request, slug=None):
        project = self.get_object()
        project.status = 'in_progress'
        project.save(update_fields=['status'])
        return Response(ProjectDetailSerializer(project, context={'request': request}).data)
