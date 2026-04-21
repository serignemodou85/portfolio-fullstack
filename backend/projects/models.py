# projects/models.py
from django.db import models
from django.conf import settings
from portfolio_backend.validators import validate_image_file

class Project(models.Model):
    """
    Modèle pour les projets du portfolio
    """
    STATUS_CHOICES = [
        ('in_progress', 'En cours'),
        ('completed', 'Terminé'),
        ('archived', 'Archivé'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    slug = models.SlugField(max_length=200, unique=True, verbose_name="Slug")
    description = models.TextField(verbose_name="Description courte")
    full_description = models.TextField(verbose_name="Description complète", blank=True)
    
    # Images
    thumbnail = models.ImageField(
        upload_to='projects/thumbnails/', 
        verbose_name="Image de couverture",
        validators=[validate_image_file],
        max_length=255
    )
    image_1 = models.ImageField(upload_to='projects/', blank=True, null=True, validators=[validate_image_file], max_length=255)
    image_2 = models.ImageField(upload_to='projects/', blank=True, null=True, validators=[validate_image_file], max_length=255)
    image_3 = models.ImageField(upload_to='projects/', blank=True, null=True, validators=[validate_image_file], max_length=255)
    
    # Technologies utilisées
    technologies = models.CharField(
        max_length=500, 
        verbose_name="Technologies",
        help_text="Séparées par des virgules (ex: Angular, Django, MySQL)"
    )
    
    # Liens
    github_url = models.URLField(blank=True, null=True, verbose_name="Lien GitHub")
    live_url = models.URLField(blank=True, null=True, verbose_name="Lien démo")
    
    # Métadonnées
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='completed',
        verbose_name="Statut",
        db_index=True
    )
    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(blank=True, null=True, verbose_name="Date de fin")

    is_featured = models.BooleanField(
        default=False,
        verbose_name="Projet mis en avant",
        db_index=True
    )
    order = models.IntegerField(
        default=0,
        verbose_name="Ordre d'affichage",
        help_text="Plus le nombre est petit, plus le projet apparaît en premier",
        db_index=True
    )

    views = models.PositiveIntegerField(
        default=0,
        verbose_name="Vues"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='projets'
    )
    
    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return self.title
