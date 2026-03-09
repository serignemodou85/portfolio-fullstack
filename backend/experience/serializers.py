# experience/serializers.py
from rest_framework import serializers
from .models import Experience
from accounts.serializers import UserPublicSerializer

class ExperienceSerializer(serializers.ModelSerializer):
    """
    Serializer pour les expériences professionnelles
    """
    created_by = UserPublicSerializer(read_only=True)
    
    # Champ calculé : durée en mois
    duration_months = serializers.SerializerMethodField()
    
    class Meta:
        model = Experience
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_duration_months(self, obj):
        """
        Calcule la durée en mois entre start_date et end_date
        """
        from datetime import date
        
        start = obj.start_date
        end = obj.end_date if obj.end_date else date.today()
        
        months = (end.year - start.year) * 12 + (end.month - start.month)
        return months


class ExperienceCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer/modifier une expérience
    """
    class Meta:
        model = Experience
        exclude = ['created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Vérifie que end_date est après start_date
        """
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError(
                    "La date de fin doit être après la date de début."
                )
        return data