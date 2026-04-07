# portfolio_backend/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import JsonResponse, HttpResponseNotFound
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Import des ViewSets
from accounts.views import UserViewSet
from accounts.views import dashboard_stats
from accounts.auth_views import (
    ThrottledTokenObtainPairView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)
from projects.views import ProjectViewSet
from experience.views import ExperienceViewSet
from skills.views import SkillCategoryViewSet, SkillViewSet
from blog.views import CategoryViewSet, TagViewSet, ArticleViewSet
from contact.views import ContactMessageViewSet

# Vue pour la racine
def api_root(request):
    """
    Point d'entrée de l'API - Documentation
    """
    return JsonResponse({
        'message': 'Bienvenue sur l\'API Portfolio',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'auth': {
                'login': '/api/auth/login/',
                'refresh': '/api/auth/refresh/',
                'password_reset_request': '/api/auth/password-reset/request/',
                'password_reset_confirm': '/api/auth/password-reset/confirm/',
            },
            'resources': {
                'projects': '/api/projects/',
                'experiences': '/api/experiences/',
                'skills': '/api/skills/',
                'skill_categories': '/api/skill-categories/',
                'blog_articles': '/api/blog/articles/',
                'blog_categories': '/api/blog/categories/',
                'blog_tags': '/api/blog/tags/',
                'contact': '/api/contact/',
            }
        }
    })


def health_check(request):
    return JsonResponse({'status': 'ok'})


def admin_block(request):
    return HttpResponseNotFound()

# Création du router DRF
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'experiences', ExperienceViewSet, basename='experience')
router.register(r'skill-categories', SkillCategoryViewSet, basename='skillcategory')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'blog/categories', CategoryViewSet, basename='category')
router.register(r'blog/tags', TagViewSet, basename='tag')
router.register(r'blog/articles', ArticleViewSet, basename='article')
router.register(r'contact', ContactMessageViewSet, basename='contact')

urlpatterns = [
    # Page d'accueil de l'API
    path('', api_root, name='api-root'),
    path('health/', health_check, name='health-check'),
    
    # Admin Django (optionnel en prod)
    path('admin/', admin.site.urls) if settings.DJANGO_ADMIN_ENABLED else path('admin/', admin_block),
    
    # Authentification JWT
    path('api/auth/login/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('api/auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('api/dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    
    
    # API REST
    path('api/', include(router.urls)),
]

# Serve media/static localement si activé dans les settings
if getattr(settings, 'SERVE_MEDIA_LOCALLY', settings.DEBUG):
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

if getattr(settings, 'SERVE_STATIC_LOCALLY', settings.DEBUG):
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    ]
