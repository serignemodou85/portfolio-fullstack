# skills/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
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
    ViewSet pour les catégories de compétences
    """
    queryset = SkillCategory.objects.prefetch_related('skills').all().order_by('order')
    serializer_class = SkillCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    
    @action(detail=False, methods=['get'])
    def with_skills(self, request):
        """
        Endpoint personnalisé : /api/skill-categories/with_skills/
        Retourne toutes les catégories avec leurs compétences
        """
        categories = self.get_queryset()
        serializer = SkillCategoryWithSkillsSerializer(categories, many=True)
        return Response(serializer.data)


class SkillViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les compétences
    """
    queryset = Skill.objects.select_related('category', 'created_by').all().order_by('category', 'order')
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SkillCreateUpdateSerializer
        return SkillSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
