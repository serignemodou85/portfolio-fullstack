# projects/serializers.py
from rest_framework import serializers
from .models import Project
from accounts.serializers import UserPublicSerializer

class ProjectListSerializer(serializers.ModelSerializer):
    """
    Serializer pour la liste des projets (version courte)
    """
    created_by = UserPublicSerializer(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'description', 'thumbnail',
            'technologies', 'status', 'is_featured', 'start_date',
            'created_by', 'created_at', 'updated_at', 'views'
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Serializer pour le détail d'un projet (version complète)
    """
    created_by = UserPublicSerializer(read_only=True)
    
    class Meta:
        model = Project
        fields = '__all__'  # Tous les champs
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer/modifier un projet
    """
    class Meta:
        model = Project
        exclude = ['created_by', 'created_at', 'updated_at']
    
    def validate_slug(self, value):
        """
        Vérifie que le slug est unique (sauf pour l'instance actuelle)
        """
        instance = self.instance
        if Project.objects.exclude(pk=instance.pk if instance else None).filter(slug=value).exists():
            raise serializers.ValidationError("Ce slug existe déjà.")
        return value
