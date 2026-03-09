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
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer

User = get_user_model()


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'


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
                subject="Reinitialisation de votre mot de passe",
                message=(
                    f"Bonjour {user.username},\n\n"
                    "Vous avez demande la reinitialisation du mot de passe admin.\n"
                    "Cliquez sur le lien ci-dessous pour definir un nouveau mot de passe:\n\n"
                    f"{reset_link}\n\n"
                    "Si vous n'etes pas a l'origine de cette demande, ignorez cet email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        # Message volontairement generique pour eviter la divulgation des comptes existants.
        return Response(
            {"detail": "Si ce compte existe, un email de reinitialisation a ete envoye."},
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
            {"detail": "Votre mot de passe a ete reinitialise avec succes."},
            status=status.HTTP_200_OK,
        )
