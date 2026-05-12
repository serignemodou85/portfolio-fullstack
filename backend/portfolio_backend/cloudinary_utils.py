# portfolio_backend/cloudinary_utils.py
from functools import lru_cache

try:
    import cloudinary.utils
except ImportError:
    cloudinary = None


@lru_cache(maxsize=512)
def _signed_url(public_id: str, resource_type: str) -> str:
    signed_url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        type='upload',
        secure=True,
        sign_url=True,
    )
    return signed_url


def safe_file_url(request, file_field):
    """Renvoie une URL HTTPS sécurisée (signée si Cloudinary)."""
    if not file_field:
        return None
    try:
        url = file_field.url
    except (ValueError, AttributeError):
        return None

    if isinstance(url, str) and 'res.cloudinary.com' in url and cloudinary:
        public_id = getattr(file_field, 'name', None)
        if public_id:
            resource_type = 'raw' if '/raw/upload/' in url else 'image'
            url = _signed_url(public_id, resource_type)

    if isinstance(url, str) and url.startswith('http://'):
        url = url.replace('http://', 'https://')
    if isinstance(url, str) and (url.startswith('https://') or url.startswith('http://')):
        return url

    return request.build_absolute_uri(url) if request else url
