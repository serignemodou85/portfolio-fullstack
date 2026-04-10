# accounts/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from django.views.decorators.cache import cache_page
from django.conf import settings
from projects.models import Project
from blog.models import Article
from contact.models import ContactMessage
from .serializers import UserSerializer, UserPublicSerializer, RegisterSerializer


User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gerer les utilisateurs
    """
    queryset = User.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        return UserSerializer

    def get_permissions(self):
        """
        Seul l'admin staff/superuser peut gerer les comptes.
        L'endpoint /me reste accessible a tout utilisateur connecte.
        """
        if self.action in ['me']:
            return [IsAuthenticated()]
        if self.action in ['public_profile']:
            return [AllowAny()]
        return [IsAdminUser()]

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Endpoint personnalise : /api/users/me/
        Retourne les infos de l'utilisateur connecte
        """
        if request.method == 'PATCH':
            serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_profile(self, request):
        """
        Endpoint public : /api/users/public_profile/
        Retourne le profil public de l'admin principal.
        """
        if not (request.user and request.user.is_authenticated):
            return cache_page(settings.CACHE_TTL)(self._public_profile_impl)(request)
        return self._public_profile_impl(request)

    def _public_profile_impl(self, request):
        user = User.objects.filter(is_superuser=True).first() or User.objects.filter(is_staff=True).first() or User.objects.first()
        if not user:
            return Response({'detail': 'Profil introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserPublicSerializer(user, context={'request': request})
        return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    project_stats = Project.objects.aggregate(
        total_projects=Count('id'),
        completed_projects=Count('id', filter=Q(status='completed')),
        in_progress_projects=Count('id', filter=Q(status='in_progress')),
        archived_projects=Count('id', filter=Q(status='archived')),
        total_views=Sum('views')
    )
    total_articles = Article.objects.count()
    total_views = project_stats.get('total_views') or 0
    active_projects = (project_stats.get('total_projects') or 0) - (project_stats.get('archived_projects') or 0)

    unread_messages = ContactMessage.objects.filter(status='new').count()

    return Response({
        "totalProjects": project_stats.get('total_projects') or 0,
        "completedProjects": project_stats.get('completed_projects') or 0,
        "inProgressProjects": project_stats.get('in_progress_projects') or 0,
        "activeProjects": max(active_projects, 0),
        "totalViews": total_views,
        "totalArticles": total_articles,
        "viewsGrowth": 0,
        "unreadMessages": unread_messages
    })
