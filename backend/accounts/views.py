# accounts/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from projects.models import Project
from blog.models import Article
from contact.models import ContactMessage
from .serializers import UserSerializer, UserPublicSerializer, RegisterSerializer


User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les utilisateurs
    """
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Seul l'admin staff/superuser peut gérer les comptes.
        L'endpoint /me reste accessible à tout utilisateur connecté.
        """
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Endpoint personnalisé : /api/users/me/
        Retourne les infos de l'utilisateur connecté
        """
        serializer = UserSerializer(request.user)
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
