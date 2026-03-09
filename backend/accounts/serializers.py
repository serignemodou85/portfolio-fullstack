# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle User - Version complète
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'profile_picture', 'phone', 'location',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url',
            'date_joined', 'is_staff', 'is_superuser'
        ]
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser']


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Serializer public - Seulement les infos visibles par tous
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'bio', 'profile_picture', 'location',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url'
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'inscription d'un nouvel utilisateur
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, data):
        """
        Vérifie que les deux mots de passe sont identiques
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data
    
    def create(self, validated_data):
        """
        Crée un nouvel utilisateur avec mot de passe hashé
        """
        validated_data.pop('password2')  # Supprime password2
        user = User.objects.create_user(**validated_data)
        return user
