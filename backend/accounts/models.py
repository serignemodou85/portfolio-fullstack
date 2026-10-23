from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from portfolio_backend.encrypted_fields import EncryptedTextField

class User(AbstractUser):
    """
    Modèle utilisateur personnalisé pour étendre le User de Django
    """
    email = models.EmailField(unique=True, verbose_name="Email")
    bio = models.TextField(blank=True, null=True, verbose_name="Biographie")
    profile_picture = CloudinaryField(
        folder='media/profiles/',
        blank=True,
        null=True,
        overwrite=True,
        invalidate=True,
        verbose_name="Photo de profil",
    )
    cv_file = CloudinaryField(
        folder='media/cv/',
        resource_type='raw',
        blank=True,
        null=True,
        overwrite=True,
        invalidate=True,
        verbose_name="CV (PDF)",
    )
    # Chiffrés au repos (Fernet) : jamais utilisés en recherche exacte, donc
    # aucun impact sur les lookups. Voir portfolio_backend/encrypted_fields.py.
    phone = EncryptedTextField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    location = EncryptedTextField(max_length=100, blank=True, null=True, verbose_name="Localisation")
    
    # Réseaux sociaux
    github_url = models.URLField(blank=True, null=True, verbose_name="GitHub")
    linkedin_url = models.URLField(blank=True, null=True, verbose_name="LinkedIn")
    twitter_url = models.URLField(blank=True, null=True, verbose_name="Twitter/X")
    website_url = models.URLField(blank=True, null=True, verbose_name="Site web")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    # 2FA TOTP : le secret est chiffré au repos, les codes de secours sont hachés.
    totp_secret = EncryptedTextField(blank=True, null=True, verbose_name="Secret 2FA")
    totp_enabled = models.BooleanField(default=False, verbose_name="2FA activée")
    # Dernier pas de temps TOTP accepté : empêche de rejouer un code déjà utilisé.
    totp_last_used_step = models.BigIntegerField(blank=True, null=True)
    totp_backup_codes = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_joined']

    def __str__(self):
        return self.username


class AuditLog(models.Model):
    """Trace des actions sensibles : connexions, 2FA, et modifications de contenu."""

    ACTION_CHOICES = [
        ('create', 'Création'),
        ('update', 'Modification'),
        ('delete', 'Suppression'),
        ('login_success', 'Connexion réussie'),
        ('login_failed', 'Connexion échouée'),
        ('login_locked', 'Compte verrouillé'),
        ('logout', 'Déconnexion'),
        ('mfa_enabled', '2FA activée'),
        ('mfa_disabled', '2FA désactivée'),
        ('mfa_failed', 'Code 2FA invalide'),
        ('password_reset', 'Mot de passe réinitialisé'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='audit_logs',
    )
    # Conservé même si le compte est supprimé, ou pour une tentative sur un compte inexistant.
    username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=32, choices=ACTION_CHOICES, db_index=True)
    model_name = models.CharField(max_length=100, blank=True, db_index=True)
    object_id = models.CharField(max_length=64, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journal d'audit"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} {self.username} {self.action} {self.model_name}"
