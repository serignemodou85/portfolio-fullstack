from django.db import models

from portfolio_backend.validators import validate_image_file


class Testimonial(models.Model):
    """Recommandation d'un collègue, enseignant ou client. Visible seulement une fois publiée."""

    author_name = models.CharField(max_length=120, verbose_name="Auteur")
    author_role = models.CharField(max_length=120, blank=True, verbose_name="Poste")
    company = models.CharField(max_length=120, blank=True, verbose_name="Entreprise / école")
    content = models.TextField(max_length=700, verbose_name="Témoignage")
    avatar = models.ImageField(
        upload_to='testimonials/avatars/',
        blank=True,
        null=True,
        validators=[validate_image_file],
        max_length=255,
        verbose_name="Photo",
    )
    linkedin_url = models.URLField(blank=True, verbose_name="LinkedIn de l'auteur")
    is_published = models.BooleanField(default=False, db_index=True, verbose_name="Publié")
    order = models.IntegerField(default=0, verbose_name="Ordre d'affichage")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Témoignage"
        verbose_name_plural = "Témoignages"
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.author_name} ({self.company})" if self.company else self.author_name
