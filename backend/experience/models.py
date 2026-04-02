# experience/models.py
from django.db import models
from django.conf import settings
from portfolio_backend.validators import validate_image_file, validate_doc_or_image

class Experience(models.Model):
    """
    Modèle pour les expériences professionnelles
    """
    EXPERIENCE_TYPE = [
        ('work', 'Expérience professionnelle'),
        ('education', 'Formation'),
        ('certification', 'Certification'),
    ]
    
    type = models.CharField(
        max_length=20, 
        choices=EXPERIENCE_TYPE,
        verbose_name="Type"
    )
    title = models.CharField(max_length=200, verbose_name="Poste/Diplôme")
    company = models.CharField(max_length=200, verbose_name="Entreprise/École")
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name="Lieu")
    
    description = models.TextField(verbose_name="Description")
    
    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(blank=True, null=True, verbose_name="Date de fin")
    is_current = models.BooleanField(default=False, verbose_name="En cours")
    
    company_logo = models.ImageField(
        upload_to='experience/logos/', 
        blank=True, 
        null=True,
        verbose_name="Logo entreprise",
        validators=[validate_image_file]
    )

    certificate_file = models.FileField(
        upload_to='experience/certificates/',
        blank=True,
        null=True,
        verbose_name="Certificat (PDF/image)",
        validators=[validate_doc_or_image]
    )
    
    order = models.IntegerField(
        default=0,
        verbose_name="Ordre d'affichage"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='experiences'
    )
    
    class Meta:
        verbose_name = "Expérience"
        verbose_name_plural = "Expériences"
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.title} - {self.company}"
