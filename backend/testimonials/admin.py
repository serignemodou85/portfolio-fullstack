from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ['author_name', 'company', 'is_published', 'order', 'created_at']
    list_filter = ['is_published']
    list_editable = ['is_published', 'order']
    search_fields = ['author_name', 'company', 'content']
