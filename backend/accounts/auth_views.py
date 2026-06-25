from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer

User = get_user_model()


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Permet de se connecter avec username OU email.
    Le front continue d'envoyer `username` pour compatibilite.
    """

    def validate(self, attrs):
        identifier = (attrs.get('username') or '').strip()
        if '@' in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
                attrs['username'] = user.get_username()
            except User.DoesNotExist:
                # Garde le comportement standard (401 identifiants invalides)
                pass
        return super().validate(attrs)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'


def _refresh_cookie_kwargs() -> dict:
    """SameSite=None;Secure en prod (cross-origin Vercel→Render), Lax en dev (localhost same-site)."""
    secure = not settings.DEBUG
    return {
        'httponly': True,
        'secure': secure,
        'samesite': 'None' if secure else 'Lax',
        'max_age': int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
    }


class CookieTokenObtainPairView(ThrottledTokenObtainPairView):
    """Login: access token dans le body JSON, refresh token dans un cookie HttpOnly."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh = response.data.pop('refresh', None)
            if refresh:
                response.set_cookie('refresh_token', refresh, **_refresh_cookie_kwargs())
        return response


class CookieTokenRefreshView(APIView):
    """Rafraîchit l'access token depuis le cookie HttpOnly, retourne le nouveau dans le body."""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request):
        raw = request.COOKIES.get('refresh_token')
        if not raw:
            return Response({'detail': 'Session expirée.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': raw})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            return Response({'detail': 'Session expirée, veuillez vous reconnecter.'}, status=status.HTTP_401_UNAUTHORIZED)

        response = Response({'access': serializer.validated_data['access']})
        if 'refresh' in serializer.validated_data:
            response.set_cookie('refresh_token', serializer.validated_data['refresh'], **_refresh_cookie_kwargs())
        return response


class CookieLogoutView(APIView):
    """Déconnexion: supprime le cookie refresh_token côté serveur."""
    permission_classes = [AllowAny]

    def post(self, _request):
        kwargs = _refresh_cookie_kwargs()
        response = Response({'detail': 'Déconnecté.'})
        response.set_cookie('refresh_token', '', max_age=0, httponly=True,
                            secure=kwargs['secure'], samesite=kwargs['samesite'])
        return response


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_password_reset_request'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        users = User.objects.filter(email__iexact=email, is_active=True, is_staff=True)

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4200').rstrip('/')

        for user in users:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{frontend_url}/admin/reset-password/confirm?uid={uid}&token={token}"
            send_mail(
                subject="Réinitialisation de votre mot de passe",
                message=(
                    f"Bonjour {user.username},\n\n"
                    "Vous avez demandé la réinitialisation du mot de passe admin.\n"
                    "Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :\n\n"
                    f"{reset_link}\n\n"
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        # Message volontairement générique pour éviter la divulgation des comptes existants.
        return Response(
            {"detail": "Si ce compte existe, un email de réinitialisation a été envoyé."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_password_reset_confirm'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response(
            {"detail": "Votre mot de passe a été réinitialisé avec succès."},
            status=status.HTTP_200_OK,
        )
