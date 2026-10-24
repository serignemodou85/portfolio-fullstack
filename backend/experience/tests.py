from django.test import SimpleTestCase

from portfolio_backend.cloudinary_utils import safe_raw_url
from .models import Experience


def resource(db_value):
    """Simule la lecture en base d'un CloudinaryField."""
    return Experience._meta.get_field('certificate_file').to_python(db_value)


class CertificateUrlTests(SimpleTestCase):
    def test_legacy_image_certificate_points_to_image_delivery(self):
        # Valeur après la migration 0007 pour un PDF envoyé du temps de l'ImageField.
        url = safe_raw_url(resource('image/upload/media/experience/certificates/Certificat_v9oo4k'))
        self.assertIn('/image/upload/', url)
        self.assertTrue(url.endswith('/media/experience/certificates/Certificat_v9oo4k'))

    def test_raw_upload_keeps_raw_delivery_version_and_extension(self):
        url = safe_raw_url(resource('raw/upload/v1786918336/media/cv/sgdwcg6v8xg9nsxciwkz.pdf'))
        self.assertIn('/raw/upload/v1786918336/', url)
        self.assertTrue(url.endswith('sgdwcg6v8xg9nsxciwkz.pdf'))
        self.assertTrue(url.startswith('https://'))

    def test_empty_value(self):
        self.assertIsNone(safe_raw_url(None))
