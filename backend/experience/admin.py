# experience/admin.py
from django.contrib import admin
from .models import Experience

@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    """
    Configuration de l'admin pour les expériences
    """
    list_display = ['title', 'company', 'type', 'start_date', 'end_date', 'is_current', 'order']
    list_filter = ['type', 'is_current', 'start_date']
    search_fields = ['title', 'company', 'description']
    
    list_editable = ['order', 'is_current']
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('type', 'title', 'company', 'location', 'company_logo')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'is_current', 'order')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)