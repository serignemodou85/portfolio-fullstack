# blog/serializers.py
from rest_framework import serializers
from .models import Category, Tag, Article
from accounts.serializers import UserPublicSerializer

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer pour les catégories d'articles
    """
    articles_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'articles_count']


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer pour les tags
    """
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class ArticleListSerializer(serializers.ModelSerializer):
    """
    Serializer pour la liste des articles (version courte)
    """
    author = UserPublicSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image',
            'category_name', 'tags', 'status', 'is_featured',
            'views_count', 'reading_time', 'published_at',
            'author', 'created_at'
        ]


class ArticleDetailSerializer(serializers.ModelSerializer):
    """
    Serializer pour le détail d'un article (version complète)
    """
    author = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Article
        fields = '__all__'
        read_only_fields = ['id', 'author', 'views_count', 'created_at', 'updated_at']


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer/modifier un article
    """
    tags_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Article
        exclude = ['author', 'views_count', 'created_at', 'updated_at', 'tags']
    
    def create(self, validated_data):
        tags_ids = validated_data.pop('tags_ids', [])
        article = Article.objects.create(**validated_data)
        
        # Ajoute les tags
        if tags_ids:
            article.tags.set(tags_ids)
        
        return article
    
    def update(self, instance, validated_data):
        tags_ids = validated_data.pop('tags_ids', None)
        
        # Met à jour les champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Met à jour les tags
        if tags_ids is not None:
            instance.tags.set(tags_ids)
        
        return instance