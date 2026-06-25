from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator


IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
DOC_EXTENSIONS = IMAGE_EXTENSIONS + ['pdf']

PDF_MAGIC = b'%PDF'
IMAGE_MAGIC = {
    b'\xff\xd8\xff',         # JPEG
    b'\x89PNG\r\n\x1a\n',   # PNG
    b'GIF87a', b'GIF89a',   # GIF
    b'RIFF',                 # WebP (followed by WEBP)
}


def _max_size(label: str, default_bytes: int) -> int:
    value = getattr(settings, label, default_bytes)
    try:
        return int(value)
    except (TypeError, ValueError):
        return default_bytes


def validate_file_size(file, max_bytes: int, label: str):
    if not file:
        return
    if file.size > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        raise ValidationError(f"{label} trop volumineux (max {max_mb:.1f} Mo).")


def _check_image_magic(file):
    try:
        file.seek(0)
        header = file.read(12)
        file.seek(0)
    except Exception:
        raise ValidationError("Impossible de lire le fichier.")
    is_webp = header[:4] == b'RIFF' and header[8:12] == b'WEBP'
    if not (is_webp or any(header.startswith(sig) for sig in IMAGE_MAGIC - {b'RIFF'})):
        raise ValidationError("Le fichier n'est pas une image valide.")


def validate_image_file(file):
    FileExtensionValidator(IMAGE_EXTENSIONS)(file)
    validate_file_size(file, _max_size('MAX_IMAGE_UPLOAD_SIZE', 5 * 1024 * 1024), 'Image')
    _check_image_magic(file)


def validate_doc_or_image(file):
    FileExtensionValidator(DOC_EXTENSIONS)(file)
    validate_file_size(file, _max_size('MAX_FILE_UPLOAD_SIZE', 10 * 1024 * 1024), 'Fichier')
    try:
        file.seek(0)
        header = file.read(12)
        file.seek(0)
    except Exception:
        raise ValidationError("Impossible de lire le fichier.")
    is_pdf = header.startswith(PDF_MAGIC)
    is_webp = header[:4] == b'RIFF' and header[8:12] == b'WEBP'
    if not (is_pdf or is_webp or any(header.startswith(sig) for sig in IMAGE_MAGIC - {b'RIFF'})):
        raise ValidationError("Le fichier doit être une image ou un PDF valide.")
