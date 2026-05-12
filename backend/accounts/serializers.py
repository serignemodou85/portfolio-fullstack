# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode

from portfolio_backend.cloudinary_utils import safe_file_url as _safe_file_url

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle User - Version complète
    """
    profile_picture = serializers.SerializerMethodField()
    cv_file = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'profile_picture', 'cv_file', 'phone', 'location',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url',
            'date_joined', 'is_staff', 'is_superuser'
        ]
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser']

    def get_profile_picture(self, obj):
        return _safe_file_url(self.context.get('request'), obj.profile_picture)

    def get_cv_file(self, obj):
        return _safe_file_url(self.context.get('request'), obj.cv_file)


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Serializer public - Seulement les infos visibles par tous
    """
    profile_picture = serializers.SerializerMethodField()
    cv_file = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'bio', 'profile_picture', 'cv_file', 'location',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url'
        ]

    def get_profile_picture(self, obj):
        return _safe_file_url(self.context.get('request'), obj.profile_picture)

    def get_cv_file(self, obj):
        return _safe_file_url(self.context.get('request'), obj.cv_file)


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
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")

        try:
            user_id = urlsafe_base64_decode(attrs['uid']).decode()
            user = User.objects.get(pk=user_id, is_active=True)
        except Exception:
            raise serializers.ValidationError("Lien de réinitialisation invalide.")

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Lien de réinitialisation invalide ou expiré.")

        validate_password(attrs['new_password'], user=user)
        attrs['user'] = user
        return attrs
