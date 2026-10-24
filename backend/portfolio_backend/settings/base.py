"""
Settings communs à tous les environnements.
Les différences dev/prod vivent dans development.py et production.py ;
le choix se fait dans __init__.py (DJANGO_ENV, ou RENDER => production).
"""
import os
import dj_database_url
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured
from django.utils.csp import CSP


def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {'1', 'true', 'yes', 'on'}


def env_list(name, default=''):
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(',') if item.strip()]


def env_required(name):
    value = os.getenv(name, '').strip()
    if not value:
        raise ImproperlyConfigured(f"La variable d'environnement '{name}' est obligatoire.")
    return value


def ensure_strong_secret_key(value):
    # Baseline Django deploy checks: secret long + non préfixe dev.
    if value.startswith('django-insecure') or len(value) < 50:
        raise ImproperlyConfigured(
            "SECRET_KEY est faible. Définis une clé longue et aléatoire dans backend/.env."
        )
    return value

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent


def load_env_file(path):
    if not path.exists():
        return
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file(BASE_DIR / '.env')


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = ensure_strong_secret_key(env_required('SECRET_KEY'))

# Clé de chiffrement au repos pour les champs sensibles (téléphone, localisation...).
# Génère-en une avec: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FIELD_ENCRYPTION_KEY = env_required('FIELD_ENCRYPTION_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env_bool('DEBUG', False)
DJANGO_ADMIN_ENABLED = env_bool('DJANGO_ADMIN_ENABLED', DEBUG)

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', 'localhost,127.0.0.1')
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip()
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
if os.getenv('RENDER') and '.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.onrender.com')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',

    # Apps tierces
    'rest_framework',  # Django REST Framework
    'rest_framework_simplejwt',  # JWT Authentication
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',  # CORS (pour Angular)
    'cloudinary',
    'cloudinary_storage',

    # Mes apps

    'accounts',
    'projects',
    'experience',
    'skills',
    'blog',
    'contact',
    'testimonials',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.csp.ContentSecurityPolicyMiddleware',
    'portfolio_backend.middleware.PermissionsPolicyMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ⚠️ Doit être avant CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'portfolio_backend.middleware.AuditRequestMiddleware',
]

# L'API ne sert que du JSON : rien ne doit pouvoir s'y exécuter ni l'embarquer.
# L'admin Django (dev uniquement) a besoin de ses propres scripts/styles.
SECURE_CSP = {
    'default-src': [CSP.NONE],
    'frame-ancestors': [CSP.NONE],
    'base-uri': [CSP.NONE],
    'form-action': [CSP.SELF],
}
if DJANGO_ADMIN_ENABLED:
    SECURE_CSP = {
        'default-src': [CSP.SELF],
        'script-src': [CSP.SELF, CSP.UNSAFE_INLINE],
        'style-src': [CSP.SELF, CSP.UNSAFE_INLINE],
        'img-src': [CSP.SELF, 'data:', 'https://res.cloudinary.com'],
        'frame-ancestors': [CSP.NONE],
        'base-uri': [CSP.SELF],
        'form-action': [CSP.SELF],
    }
PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'

ROOT_URLCONF = 'portfolio_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'portfolio_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

# Render/Prod: utilise DATABASE_URL si fourni (PostgreSQL)
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': env_required('DB_NAME'),
            'USER': env_required('DB_USER'),
            'PASSWORD': env_required('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST', '127.0.0.1'),
            'PORT': os.getenv('DB_PORT', '3307'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            },
        }
    }


PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]

# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True

# https://docs.djangoproject.com/en/6.0/topics/i18n/



# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# Media files (uploads utilisateur)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary (stockage media en production)
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    STORAGES['default'] = {
        'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage',
    }

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========================================
# CONFIGURATION DJANGO REST FRAMEWORK
# ========================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.getenv('API_THROTTLE_ANON_RATE', '120/hour'),
        'user': os.getenv('API_THROTTLE_USER_RATE', '1200/hour'),
        'auth_login': os.getenv('API_THROTTLE_AUTH_LOGIN_RATE', '10/minute'),
        'auth_password_reset_request': os.getenv('API_THROTTLE_PASSWORD_RESET_REQUEST_RATE', '5/hour'),
        'auth_password_reset_confirm': os.getenv('API_THROTTLE_PASSWORD_RESET_CONFIRM_RATE', '10/hour'),
        'contact_create': os.getenv('API_THROTTLE_CONTACT_CREATE_RATE', '20/hour'),
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'PAGE_SIZE_QUERY_PARAM': 'page_size',
    'MAX_PAGE_SIZE': 1000,
}

# SimpleJWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_MINUTES', '15'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_DAYS', '1'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Le cookie refresh n'est envoyé qu'aux endpoints d'auth, jamais au reste de l'API.
# Nouveau nom : l'ancien cookie `refresh_token` (path=/) est simplement ignoré puis effacé,
# sans collision possible avec le nouveau (Django indexe les cookies de réponse par nom).
REFRESH_COOKIE_NAME = 'portfolio_refresh'
REFRESH_COOKIE_PATH = '/api/auth/'
LEGACY_REFRESH_COOKIE_NAME = 'refresh_token'

# ========================================
# CONFIGURATION JWT
# ========================================
# En développement, autorise Angular sur localhost:4200
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:4200,http://127.0.0.1:4200,https://frontend-woad-psi-66.vercel.app,https://portfolio-frontend-rho-silk.vercel.app'
)

CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://portfolio-frontend[\w\-]*\.vercel\.app$',
    r'^https://frontend-woad[\w\-]*\.vercel\.app$',
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnn-origin',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

AUTH_USER_MODEL = 'accounts.User'

# Cache (API)
CACHE_TTL = int(os.getenv('CACHE_TTL', '60'))
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'portfolio-cache',
        'TIMEOUT': CACHE_TTL,
    },
    # Compteurs de verrouillage de compte : doivent être partagés entre tous
    # les workers gunicorn, donc en base (un LocMemCache est propre à chaque process).
    'security': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'security_cache',
    },
}

CSRF_TRUSTED_ORIGINS = env_list(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:4200,http://127.0.0.1:4200,https://frontend-woad-psi-66.vercel.app,https://portfolio-frontend-rho-silk.vercel.app'
)

# Sécurité transport/cookies (SSL, HSTS, cookies Secure) : voir development.py / production.py
SECURE_CONTENT_TYPE_NOSNIFF = env_bool('SECURE_CONTENT_TYPE_NOSNIFF', True)
X_FRAME_OPTIONS = os.getenv('X_FRAME_OPTIONS', 'DENY')
SECURE_REFERRER_POLICY = os.getenv('SECURE_REFERRER_POLICY', 'same-origin')
SECURE_CROSS_ORIGIN_OPENER_POLICY = os.getenv('SECURE_CROSS_ORIGIN_OPENER_POLICY', 'same-origin')
SECURE_CROSS_ORIGIN_RESOURCE_POLICY = os.getenv('SECURE_CROSS_ORIGIN_RESOURCE_POLICY', 'same-site')
SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SAMESITE = os.getenv('CSRF_COOKIE_SAMESITE', 'Lax')

# Limites upload
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv('DATA_UPLOAD_MAX_MEMORY_SIZE', str(5 * 1024 * 1024)))
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv('FILE_UPLOAD_MAX_MEMORY_SIZE', str(5 * 1024 * 1024)))
MAX_IMAGE_UPLOAD_SIZE = int(os.getenv('MAX_IMAGE_UPLOAD_SIZE', str(5 * 1024 * 1024)))
MAX_FILE_UPLOAD_SIZE = int(os.getenv('MAX_FILE_UPLOAD_SIZE', str(10 * 1024 * 1024)))

# Sert les fichiers media/static avec Django (utile en local même si DEBUG=False).
# En production derrière Nginx/Apache, laisser ces valeurs à false.
SERVE_MEDIA_LOCALLY = env_bool('SERVE_MEDIA_LOCALLY', DEBUG)
SERVE_STATIC_LOCALLY = env_bool('SERVE_STATIC_LOCALLY', DEBUG)

# ========================================
# CONFIGURATION EMAIL (SMTP / GMAIL)
# ========================================
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)
EMAIL_USE_SSL = env_bool('EMAIL_USE_SSL', False)
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', '5'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'no-reply@portfolio.local')

# Email(s) de notification admin, séparés par virgule dans CONTACT_ADMIN_EMAILS
_contact_admin_emails = os.getenv('CONTACT_ADMIN_EMAILS', EMAIL_HOST_USER or '')
CONTACT_ADMIN_EMAILS = [email.strip() for email in _contact_admin_emails.split(',') if email.strip()]

# Active/désactive l'email automatique envoyé au client après envoi du formulaire
CONTACT_AUTO_REPLY_ENABLED = env_bool('CONTACT_AUTO_REPLY_ENABLED', True)

# URL frontend utilisee dans les emails (liens reset password).
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:4200')

# URL publique du site (sitemap.xml). Par défaut, celle du frontend.
SITE_URL = os.getenv('SITE_URL', FRONTEND_URL)

# Activité GitHub affichée sur l'accueil. Le jeton est optionnel (relève la limite de 60 req/h).
GITHUB_USERNAME = os.getenv('GITHUB_USERNAME', 'serignemodou85')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '').strip()

# ========================================
# SÉCURITÉ COMPTE / RGPD
# ========================================
# Verrouillage après N échecs de connexion (mot de passe ou code 2FA) sur un même identifiant.
LOGIN_LOCKOUT_MAX_ATTEMPTS = int(os.getenv('LOGIN_LOCKOUT_MAX_ATTEMPTS', '5'))
LOGIN_LOCKOUT_WINDOW_SECONDS = int(os.getenv('LOGIN_LOCKOUT_WINDOW_SECONDS', str(15 * 60)))

# Le reset de mot de passe répond toujours en au moins ce délai, compte existant ou non,
# et l'email part en arrière-plan : le temps de réponse ne révèle pas si le compte existe.
PASSWORD_RESET_MIN_RESPONSE_SECONDS = float(os.getenv('PASSWORD_RESET_MIN_RESPONSE_SECONDS', '0.3'))
PASSWORD_RESET_ASYNC_EMAIL = env_bool('PASSWORD_RESET_ASYNC_EMAIL', True)

# Durée de validité du jeton intermédiaire entre "mot de passe OK" et "code 2FA saisi".
MFA_LOGIN_TOKEN_MAX_AGE_SECONDS = 5 * 60
MFA_ISSUER_NAME = os.getenv('MFA_ISSUER_NAME', 'Portfolio Modou Fall')

# Rétention des données personnelles (purgées par `manage.py purge_personal_data`).
CONTACT_IP_RETENTION_DAYS = int(os.getenv('CONTACT_IP_RETENTION_DAYS', '30'))
AUDIT_LOG_RETENTION_DAYS = int(os.getenv('AUDIT_LOG_RETENTION_DAYS', '365'))
