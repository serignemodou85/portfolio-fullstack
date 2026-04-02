from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator


IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
DOC_EXTENSIONS = IMAGE_EXTENSIONS + ['pdf']


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


def validate_image_file(file):
    FileExtensionValidator(IMAGE_EXTENSIONS)(file)
    validate_file_size(file, _max_size('MAX_IMAGE_UPLOAD_SIZE', 5 * 1024 * 1024), 'Image')


def validate_doc_or_image(file):
    FileExtensionValidator(DOC_EXTENSIONS)(file)
    validate_file_size(file, _max_size('MAX_FILE_UPLOAD_SIZE', 10 * 1024 * 1024), 'Fichier')
