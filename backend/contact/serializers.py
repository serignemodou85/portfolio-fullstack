# contact/serializers.py
from rest_framework import serializers
from .models import ContactMessage

class ContactMessageSerializer(serializers.ModelSerializer):
    """
    Serializer pour les messages de contact
    """
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['id', 'status', 'created_at', 'read_at', 'ip_address']


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer un message de contact (formulaire public)
    """
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'phone', 'subject', 'message']
    
    def validate_name(self, value):
        value = (value or '').strip()
        if len(value) < 2:
            raise serializers.ValidationError("Le nom doit contenir au moins 2 caractères.")
        return value

    def validate_email(self, value):
        """
        Validation personnalisée de l'email
        """
        if not value or '@' not in value:
            raise serializers.ValidationError("Email invalide.")
        return value.lower()

    def validate_subject(self, value):
        value = (value or '').strip()
        if len(value) < 3:
            raise serializers.ValidationError("Le sujet doit contenir au moins 3 caractères.")
        return value

    def validate_message(self, value):
        """
        Vérifie que le message n'est pas trop court
        """
        value = (value or '').strip()
        if len(value) < 10:
            raise serializers.ValidationError(
                "Le message doit contenir au moins 10 caractères."
            )
        return value
