# skills/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from django.conf import settings
from django.db.models import Count

from portfolio_backend.permissions import IsAdminOrReadOnly
from .models import SkillCategory, Skill
from .serializers import (
    SkillCategorySerializer,
    SkillSerializer,
    SkillCreateUpdateSerializer,
    SkillCategoryWithSkillsSerializer
)


class SkillCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les categories de competences
    """
    queryset = SkillCategory.objects.annotate(skills_count=Count('skills')).order_by('order')
    serializer_class = SkillCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['get'])
    def with_skills(self, request):
        """
        Endpoint personnalise : /api/skill-categories/with_skills/
        Retourne toutes les categories avec leurs competences
        """
        if request.user and request.user.is_authenticated:
            categories = self.get_queryset().prefetch_related('skills')
            serializer = SkillCategoryWithSkillsSerializer(categories, many=True)
            return Response(serializer.data)

        return cache_page(settings.CACHE_TTL)(self._with_skills_public)(request)

    def _with_skills_public(self, request):
        categories = self.get_queryset().prefetch_related('skills')
        serializer = SkillCategoryWithSkillsSerializer(categories, many=True)
        return Response(serializer.data)


class SkillViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les competences
    """
    queryset = Skill.objects.select_related('category', 'created_by').all().order_by('category', 'order')
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SkillCreateUpdateSerializer
        return SkillSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
