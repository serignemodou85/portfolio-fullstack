# skills/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class SkillCategory(models.Model):
    """
    Catégories de compétences (Frontend, Backend, DevOps, etc.)
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom")
    icon = models.CharField(
        max_length=50, 
        blank=True,
        verbose_name="Icône",
        help_text="Nom de l'icône (ex: code, database, server)"
    )
    order = models.IntegerField(default=0, verbose_name="Ordre d'affichage")
    
    class Meta:
        verbose_name = "Catégorie de compétence"
        verbose_name_plural = "Catégories de compétences"
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class Skill(models.Model):
    """
    Compétences techniques
    """
    PROFICIENCY_LEVELS = [
        (1, 'Débutant'),
        (2, 'Intermédiaire'),
        (3, 'Avancé'),
        (4, 'Expert'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Nom")
    category = models.ForeignKey(
        SkillCategory,
        on_delete=models.CASCADE,
        related_name='skills',
        verbose_name="Catégorie"
    )
    
    proficiency = models.IntegerField(
        choices=PROFICIENCY_LEVELS,
        default=2,
        verbose_name="Niveau de maîtrise"
    )
    
    # Niveau en pourcentage (pour les barres de progression)
    percentage = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50,
        verbose_name="Pourcentage",
        help_text="Niveau de 0 à 100%"
    )
    
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Icône/Logo",
        help_text="Nom de l'icône ou chemin du logo"
    )
    
    years_of_experience = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=0,
        verbose_name="Années d'expérience"
    )
    
    order = models.IntegerField(default=0, verbose_name="Ordre d'affichage", db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='skills'
    )
    
    class Meta:
        verbose_name = "Compétence"
        verbose_name_plural = "Compétences"
        ordering = ['category', 'order', 'name']
        unique_together = ['name', 'category']  # Évite les doublons
    
    def __str__(self):
        return f"{self.name} ({self.category.name})"