# skills/admin.py
from django.contrib import admin
from .models import SkillCategory, Skill

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    """
    Configuration de l'admin pour les catégories de compétences
    """
    list_display = ['name', 'icon', 'order']
    list_editable = ['order']
    search_fields = ['name']

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    """
    Configuration de l'admin pour les compétences
    """
    list_display = ['name', 'category', 'proficiency', 'percentage', 'years_of_experience', 'order']
    list_filter = ['category', 'proficiency']
    search_fields = ['name']
    
    list_editable = ['proficiency', 'percentage', 'order']
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('name', 'category', 'icon')
        }),
        ('Niveau de maîtrise', {
            'fields': ('proficiency', 'percentage', 'years_of_experience')
        }),
        ('Affichage', {
            'fields': ('order',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)