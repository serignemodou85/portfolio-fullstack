# experience/serializers.py
from rest_framework import serializers

from .models import Experience
from portfolio_backend.cloudinary_utils import safe_file_url as _safe_file_url


class ExperienceSerializer(serializers.ModelSerializer):
    """
    Serializer pour les experiences professionnelles
    """
    company_logo = serializers.SerializerMethodField()
    certificate_file = serializers.SerializerMethodField()
    duration_months = serializers.SerializerMethodField()

    class Meta:
        model = Experience
        fields = [
            'id', 'duration_months', 'type', 'title', 'company', 'location',
            'description', 'start_date', 'end_date', 'is_current', 'company_logo',
            'certificate_file', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_duration_months(self, obj):
        from datetime import date

        start = obj.start_date
        end = obj.end_date if obj.end_date else date.today()

        months = (end.year - start.year) * 12 + (end.month - start.month)
        return months

    def get_company_logo(self, obj):
        return _safe_file_url(self.context.get('request'), obj.company_logo)

    def get_certificate_file(self, obj):
        return _safe_file_url(self.context.get('request'), obj.certificate_file)


class ExperienceCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour creer/modifier une experience
    """

    class Meta:
        model = Experience
        exclude = ['created_by', 'created_at', 'updated_at']

    def validate(self, data):
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError(
                    'La date de fin doit etre apres la date de debut.'
                )
        return data
