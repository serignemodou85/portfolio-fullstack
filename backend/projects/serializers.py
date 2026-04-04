# projects/serializers.py
from rest_framework import serializers
from .models import Project
from accounts.serializers import UserPublicSerializer


def _safe_file_url(request, file_field):
    if not file_field:
        return None
    try:
        url = file_field.url
    except Exception:
        return None
    return request.build_absolute_uri(url) if request else url


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Serializer pour la liste des projets (version courte)
    """
    created_by = UserPublicSerializer(read_only=True)
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'description', 'thumbnail',
            'technologies', 'status', 'is_featured', 'start_date',
            'created_by', 'created_at', 'updated_at', 'views'
        ]

    def get_thumbnail(self, obj):
        return _safe_file_url(self.context.get('request'), obj.thumbnail)


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Serializer pour le détail d'un projet (version complète)
    """
    created_by = UserPublicSerializer(read_only=True)
    thumbnail = serializers.SerializerMethodField()
    image_1 = serializers.SerializerMethodField()
    image_2 = serializers.SerializerMethodField()
    image_3 = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'  # Tous les champs
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_thumbnail(self, obj):
        return _safe_file_url(self.context.get('request'), obj.thumbnail)

    def get_image_1(self, obj):
        return _safe_file_url(self.context.get('request'), obj.image_1)

    def get_image_2(self, obj):
        return _safe_file_url(self.context.get('request'), obj.image_2)

    def get_image_3(self, obj):
        return _safe_file_url(self.context.get('request'), obj.image_3)


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