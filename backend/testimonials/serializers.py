from rest_framework import serializers

from portfolio_backend.cloudinary_utils import safe_file_url
from .models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = [
            'id', 'author_name', 'author_role', 'company', 'content', 'avatar',
            'linkedin_url', 'is_published', 'order', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
        # Écriture via le champ ; lecture via safe_file_url (gère l'absence de fichier).
        extra_kwargs = {'avatar': {'required': False, 'allow_null': True, 'write_only': True}}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['avatar'] = safe_file_url(self.context.get('request'), instance.avatar)
        return data
