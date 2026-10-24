from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from portfolio_backend.permissions import IsAdminOrReadOnly
from .models import Testimonial
from .serializers import TestimonialSerializer


class TestimonialViewSet(viewsets.ModelViewSet):
    """Public : témoignages publiés uniquement. Staff : tous, en lecture et écriture."""
    serializer_class = TestimonialSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = Testimonial.objects.all()
        user = self.request.user
        if not (user and user.is_authenticated and user.is_staff):
            qs = qs.filter(is_published=True)
        return qs
