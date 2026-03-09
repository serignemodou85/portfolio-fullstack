from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    Modèle utilisateur personnalisé pour étendre le User de Django
    """
    email = models.EmailField(unique=True, verbose_name="Email")
    bio = models.TextField(blank=True, null=True, verbose_name="Biographie")
    profile_picture = models.ImageField(
        upload_to='profiles/', 
        blank=True, 
        null=True,
        verbose_name="Photo de profil"
    )
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name="Localisation")
    
    # Réseaux sociaux
    github_url = models.URLField(blank=True, null=True, verbose_name="GitHub")
    linkedin_url = models.URLField(blank=True, null=True, verbose_name="LinkedIn")
    twitter_url = models.URLField(blank=True, null=True, verbose_name="Twitter/X")
    website_url = models.URLField(blank=True, null=True, verbose_name="Site web")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.username