# portfolio_backend/cloudinary_utils.py
import cloudinary.utils


def safe_file_url(request, file_field):
    """Retourne une URL HTTPS pour un champ image/fichier Django/Cloudinary."""
    if not file_field:
        return None
    try:
        url = file_field.url
    except (ValueError, AttributeError):
        return None

    if not isinstance(url, str) or not url:
        return None

    if url.startswith('http://'):
        url = 'https://' + url[7:]

    if url.startswith('https://'):
        return url

    return request.build_absolute_uri(url) if request else url


def safe_raw_url(file_field) -> str | None:
    """URL correcte pour les fichiers raw Cloudinary (PDF, certificats, CV).

    CloudinaryField stocke en base : raw/upload/v{version}/{public_id}.{format}
    str(field) retourne uniquement le public_id — sans version ni extension.
    On lit les attributs du CloudinaryResource pour reconstruire l'URL complète
    avec la vraie version et le bon format, évitant le placeholder v1 erroné.
    """
    if not file_field:
        return None
    try:
        public_id = getattr(file_field, 'public_id', None) or str(file_field)
        if not public_id:
            return None

        kwargs: dict = {
            'resource_type': 'raw',
            'type': getattr(file_field, 'type', None) or 'upload',
            'secure': True,
            'force_version': False,
        }
        fmt = getattr(file_field, 'format', None)
        version = getattr(file_field, 'version', None)
        if fmt:
            kwargs['format'] = fmt
        if version:
            kwargs['version'] = version

        url, _ = cloudinary.utils.cloudinary_url(public_id, **kwargs)
        return url or None
    except Exception:
        return None
