# projects/admin.py
from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """
    Configuration de l'admin pour les projets
    """
    list_display = ['title', 'status', 'is_featured', 'start_date', 'order', 'created_at']
    list_filter = ['status', 'is_featured', 'start_date']
    search_fields = ['title', 'description', 'technologies']
    prepopulated_fields = {'slug': ('title',)}  # Génère automatiquement le slug
    
    list_editable = ['is_featured', 'order', 'status']  # Édition rapide dans la liste
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('title', 'slug', 'description', 'full_description', 'status')
        }),
        ('Images', {
            'fields': ('thumbnail', 'image_1', 'image_2', 'image_3')
        }),
        ('Détails techniques', {
            'fields': ('technologies', 'github_url', 'live_url')
        }),
        ('Dates et affichage', {
            'fields': ('start_date', 'end_date', 'is_featured', 'order')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    # Remplir automatiquement created_by avec l'utilisateur connecté
    def save_model(self, request, obj, form, change):
        if not obj.pk:  # Si c'est une création
            obj.created_by = request.user
        super().save_model(request, obj, form, change)