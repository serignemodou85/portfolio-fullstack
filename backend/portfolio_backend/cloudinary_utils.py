# portfolio_backend/cloudinary_utils.py


def safe_file_url(request, file_field):
    """Retourne une URL HTTPS accessible pour un champ fichier Django/Cloudinary."""
    if not file_field:
        return None
    try:
        url = file_field.url
    except (ValueError, AttributeError):
        return None

    if not isinstance(url, str) or not url:
        return None

    # Forcer HTTPS (Cloudinary renvoie parfois http://)
    if url.startswith('http://'):
        url = 'https://' + url[7:]

    if url.startswith('https://'):
        return url

    # URL relative → URL absolue
    return request.build_absolute_uri(url) if request else url
