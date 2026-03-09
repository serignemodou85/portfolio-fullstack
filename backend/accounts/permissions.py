# accounts/permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission personnalisée : seul le propriétaire peut modifier
    """
    def has_object_permission(self, request, view, obj):
        # Les permissions de lecture sont accordées à toute requête
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Les permissions d'écriture sont accordées uniquement au propriétaire
        return obj.created_by == request.user or obj.author == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission personnalisée : seuls les admins peuvent modifier
    """
    def has_permission(self, request, view):
        # Les permissions de lecture sont accordées à toute requête
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Les permissions d'écriture sont accordées uniquement aux admins
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission personnalisée : propriétaire ou admin peuvent modifier
    """
    def has_object_permission(self, request, view, obj):
        # Les admins ont tous les droits
        if request.user and request.user.is_staff:
            return True
        
        # Vérifie si l'utilisateur est le propriétaire
        owner_field = getattr(obj, 'created_by', None) or getattr(obj, 'author', None) or getattr(obj, 'user', None)
        return owner_field == request.user
