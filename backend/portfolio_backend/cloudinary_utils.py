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

    CloudinaryField.url génère une URL image même pour resource_type='raw'.
    Cette fonction force resource_type='raw' explicitement.
    """
    if not file_field:
        return None
    try:
        url, _ = cloudinary.utils.cloudinary_url(
            str(file_field),
            resource_type='raw',
            secure=True,
        )
        return url or None
    except Exception:
        return None
