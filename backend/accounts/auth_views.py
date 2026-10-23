import logging
import threading
import time

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken

from . import lockout, mfa
from .audit import log_event
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer

User = get_user_model()
logger = logging.getLogger(__name__)

LOCKED_MESSAGE = "Trop de tentatives. Réessayez dans 15 minutes."


def _lockout_key(identifier: str) -> str:
    """Même compteur que l'on se connecte par username ou par email."""
    identifier = (identifier or '').strip()
    lookup = {'email__iexact': identifier} if '@' in identifier else {'username__iexact': identifier}
    user_id = User.objects.filter(**lookup).values_list('pk', flat=True).first()
    return f'user:{user_id}' if user_id else f'id:{identifier.lower()}'


def _refresh_cookie_kwargs() -> dict:
    """SameSite=None;Secure en prod (cross-origin Vercel→Render), Lax en dev (localhost same-site)."""
    secure = not settings.DEBUG and settings.SESSION_COOKIE_SECURE
    return {
        'httponly': True,
        'secure': secure,
        'samesite': 'None' if secure else 'Lax',
        'path': settings.REFRESH_COOKIE_PATH,
    }


def _set_refresh_cookie(response, refresh: str) -> None:
    kwargs = _refresh_cookie_kwargs()
    max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(settings.REFRESH_COOKIE_NAME, refresh, max_age=max_age, **kwargs)
    response.delete_cookie(settings.LEGACY_REFRESH_COOKIE_NAME, path='/', samesite=kwargs['samesite'])


def _clear_refresh_cookie(response) -> None:
    samesite = _refresh_cookie_kwargs()['samesite']
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path=settings.REFRESH_COOKIE_PATH, samesite=samesite)
    response.delete_cookie(settings.LEGACY_REFRESH_COOKIE_NAME, path='/', samesite=samesite)


def _issue_session(user) -> Response:
    refresh = RefreshToken.for_user(user)
    if jwt_settings.UPDATE_LAST_LOGIN:
        update_last_login(None, user)
    response = Response({'access': str(refresh.access_token)})
    _set_refresh_cookie(response, str(refresh))
    return response


class EmailOrUsernameAuthSerializer(TokenObtainSerializer):
    """Vérifie seulement les identifiants ; l'émission des jetons est décidée par la vue (2FA)."""
    token_class = RefreshToken

    def validate(self, attrs):
        identifier = (attrs.get('username') or '').strip()
        if '@' in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                attrs['username'] = user.get_username()
        super().validate(attrs)
        return {}


class CookieTokenObtainPairView(APIView):
    """
    Login. Sans 2FA : access token dans le body, refresh token en cookie HttpOnly.
    Avec 2FA : renvoie un jeton intermédiaire à échanger contre un code sur /2fa/verify/.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request):
        identifier = (request.data.get('username') or '').strip()
        key = _lockout_key(identifier)
        if lockout.is_locked(key):
            log_event('login_locked', request=request, username=identifier)
            return Response({'detail': LOCKED_MESSAGE}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = EmailOrUsernameAuthSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed as exc:
            lockout.register_failure(key)
            log_event('login_failed', request=request, username=identifier)
            # Renvoyé explicitement : sans classe d'authentification, DRF convertirait ce 401 en 403.
            return Response({'detail': exc.detail}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        if user.totp_enabled:
            return Response({'mfa_required': True, 'mfa_token': mfa.make_login_token(user)})

        lockout.reset(key)
        log_event('login_success', request=request, user=user)
        return _issue_session(user)


class MfaLoginVerifyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request):
        user = mfa.read_login_token(request.data.get('mfa_token'), User)
        if user is None:
            return Response(
                {'detail': 'Session de connexion expirée, recommencez.', 'code': 'mfa_token_expired'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        key = f'user:{user.pk}'
        if lockout.is_locked(key):
            log_event('login_locked', request=request, user=user)
            return Response({'detail': LOCKED_MESSAGE}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if not mfa.verify_second_factor(user, request.data.get('code')):
            lockout.register_failure(key)
            log_event('mfa_failed', request=request, user=user)
            return Response({'detail': 'Code invalide.'}, status=status.HTTP_401_UNAUTHORIZED)

        lockout.reset(key)
        log_event('login_success', request=request, user=user, changes={'mfa': True})
        return _issue_session(user)


class CookieTokenRefreshView(APIView):
    """Rafraîchit l'access token depuis le cookie HttpOnly, retourne le nouveau dans le body."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request):
        raw = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not raw:
            return Response({'detail': 'Session expirée.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': raw})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            response = Response({'detail': 'Session expirée, veuillez vous reconnecter.'}, status=status.HTTP_401_UNAUTHORIZED)
            _clear_refresh_cookie(response)
            return response

        response = Response({'access': serializer.validated_data['access']})
        if 'refresh' in serializer.validated_data:
            _set_refresh_cookie(response, serializer.validated_data['refresh'])
        return response


class CookieLogoutView(APIView):
    """Déconnexion : blackliste le refresh token et supprime le cookie."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if raw:
            try:
                token = RefreshToken(raw)
                user = User.objects.filter(pk=token.get('user_id')).first()
                token.blacklist()
                if user:
                    log_event('logout', request=request, user=user)
            except TokenError:
                pass
        response = Response({'detail': 'Déconnecté.'})
        _clear_refresh_cookie(response)
        return response


def _send_reset_email(user_email: str, username: str, reset_link: str) -> None:
    try:
        send_mail(
            subject="Réinitialisation de votre mot de passe",
            message=(
                f"Bonjour {username},\n\n"
                "Vous avez demandé la réinitialisation du mot de passe admin.\n"
                "Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :\n\n"
                f"{reset_link}\n\n"
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
    except Exception:
        logger.exception('password reset email failed')


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_password_reset_request'

    def post(self, request):
        started = time.monotonic()
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4200').rstrip('/')

        for user in User.objects.filter(email__iexact=email, is_active=True, is_staff=True):
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{frontend_url}/admin/reset-password/confirm?uid={uid}&token={token}"
            args = (user.email, user.get_username(), reset_link)
            if settings.PASSWORD_RESET_ASYNC_EMAIL:
                # L'envoi SMTP prend du temps : en arrière-plan, il ne trahit pas l'existence du compte.
                threading.Thread(target=_send_reset_email, args=args, daemon=True).start()
            else:
                _send_reset_email(*args)

        remaining = settings.PASSWORD_RESET_MIN_RESPONSE_SECONDS - (time.monotonic() - started)
        if remaining > 0:
            time.sleep(remaining)

        # Message volontairement générique pour éviter la divulgation des comptes existants.
        return Response(
            {"detail": "Si ce compte existe, un email de réinitialisation a été envoyé."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_password_reset_confirm'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        lockout.reset(f'user:{user.pk}')
        log_event('password_reset', request=request, user=user)

        return Response(
            {"detail": "Votre mot de passe a été réinitialisé avec succès."},
            status=status.HTTP_200_OK,
        )


class MfaSetupView(APIView):
    """Génère un secret en attente (2FA pas encore active) et le QR code à scanner."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        user = request.user
        if user.totp_enabled:
            return Response({'detail': 'La 2FA est déjà activée.'}, status=status.HTTP_400_BAD_REQUEST)
        secret = mfa.new_secret()
        user.totp_secret = secret
        user.totp_last_used_step = None
        user.save(update_fields=['totp_secret', 'totp_last_used_step'])
        return Response(mfa.provisioning(user, secret))


class MfaEnableView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user = request.user
        if user.totp_enabled:
            return Response({'detail': 'La 2FA est déjà activée.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.totp_secret:
            return Response({'detail': 'Lancez d\'abord la configuration.'}, status=status.HTTP_400_BAD_REQUEST)
        if not mfa.verify_totp(user, request.data.get('code')):
            return Response({'detail': 'Code invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        codes = mfa.generate_backup_codes(user)
        user.totp_enabled = True
        user.save(update_fields=['totp_enabled', 'totp_backup_codes'])
        log_event('mfa_enabled', request=request, user=user)
        return Response({'backup_codes': codes})


class MfaDisableView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user = request.user
        if not user.totp_enabled:
            return Response({'detail': 'La 2FA n\'est pas activée.'}, status=status.HTTP_400_BAD_REQUEST)
        if not mfa.verify_second_factor(user, request.data.get('code')):
            return Response({'detail': 'Code invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_enabled = False
        user.totp_secret = None
        user.totp_backup_codes = []
        user.totp_last_used_step = None
        user.save(update_fields=['totp_enabled', 'totp_secret', 'totp_backup_codes', 'totp_last_used_step'])
        log_event('mfa_disabled', request=request, user=user)
        return Response({'detail': '2FA désactivée.'})
