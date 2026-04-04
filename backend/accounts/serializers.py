# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode

User = get_user_model()


def _safe_file_url(request, file_field):
    if not file_field:
        return None
    try:
        url = file_field.url
    except Exception:
        return None
    return request.build_absolute_uri(url) if request else url


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle User - Version complète
    """
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'profile_picture', 'phone', 'location',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url',
            'date_joined', 'is_staff', 'is_superuser'
        ]
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser']

    def get_profile_picture(self, obj):
        return _safe_file_url(self.context.get('request'), obj.profile_picture)


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Serializer public - Seulement les infos visibles par tous
    """
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'bio', 'profile_picture', 'location',
            'github_url', 'linkedin_url', 'twitter_url', 'website_url'
        ]

    def get_profile_picture(self, obj):
        return _safe_file_url(self.context.get('request'), obj.profile_picture)


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
            raise serializers.ValidationError("Lien de reinitialisation invalide.")

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Lien de reinitialisation invalide ou expire.")

        validate_password(attrs['new_password'], user=user)
        attrs['user'] = user
        return attrs