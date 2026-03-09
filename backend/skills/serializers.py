# skills/serializers.py
from rest_framework import serializers
from .models import SkillCategory, Skill
from accounts.serializers import UserPublicSerializer

class SkillCategorySerializer(serializers.ModelSerializer):
    """
    Serializer pour les catégories de compétences
    """
    # Compte le nombre de compétences dans cette catégorie
    skills_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'icon', 'order', 'skills_count']
    
    def get_skills_count(self, obj):
        return obj.skills.count()


class SkillSerializer(serializers.ModelSerializer):
    """
    Serializer pour les compétences
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    
    # Affiche le libellé du niveau au lieu du chiffre
    proficiency_display = serializers.CharField(
        source='get_proficiency_display',
        read_only=True
    )
    
    class Meta:
        model = Skill
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class SkillCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer/modifier une compétence
    """
    class Meta:
        model = Skill
        exclude = ['created_by', 'created_at', 'updated_at']


class SkillCategoryWithSkillsSerializer(serializers.ModelSerializer):
    """
    Serializer pour afficher une catégorie avec toutes ses compétences
    """
    skills = SkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'icon', 'order', 'skills']