# contact/admin.py
from django.contrib import admin
from django.utils import timezone
from .models import ContactMessage

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """
    Configuration de l'admin pour les messages de contact
    """
    list_display = ['name', 'email', 'subject', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    
    list_editable = ['status']
    
    fieldsets = (
        ('Expéditeur', {
            'fields': ('name', 'email', 'phone', 'ip_address')
        }),
        ('Message', {
            'fields': ('subject', 'message')
        }),
        ('Gestion', {
            'fields': ('status', 'read_at')
        }),
    )
    
    readonly_fields = ['created_at', 'ip_address', 'read_at']
    
    # Marque le message comme "lu" quand on l'ouvre
    def save_model(self, request, obj, form, change):
        if change and obj.status == 'read' and not obj.read_at:
            obj.read_at = timezone.now()
        super().save_model(request, obj, form, change)