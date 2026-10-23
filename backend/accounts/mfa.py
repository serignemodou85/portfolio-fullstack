# accounts/mfa.py
import secrets
import time

import pyotp
import segno
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core import signing

BACKUP_CODE_COUNT = 8
_LOGIN_TOKEN_SALT = 'accounts.mfa.login'


def new_secret() -> str:
    return pyotp.random_base32()


def provisioning(user, secret: str) -> dict:
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=user.email or user.get_username(),
        issuer_name=settings.MFA_ISSUER_NAME,
    )
    qr = segno.make(uri, error='m').svg_data_uri(scale=5, border=2)
    return {'otpauth_uri': uri, 'qr_code': qr, 'secret': secret}


def _normalize(code) -> str:
    return ''.join(str(code or '').split()).replace('-', '').upper()


def verify_totp(user, code, secret=None, commit=True) -> bool:
    """Code valide dans une fenêtre de ±30 s, et jamais deux fois le même pas de temps."""
    secret = secret or user.totp_secret
    code = _normalize(code)
    if not secret or not code.isdigit() or len(code) != 6:
        return False
    totp = pyotp.TOTP(secret)
    current_step = int(time.time() // totp.interval)
    for offset in (-1, 0, 1):
        step = current_step + offset
        if secrets.compare_digest(totp.generate_otp(step), code):
            if user.totp_last_used_step is not None and step <= user.totp_last_used_step:
                return False
            if commit:
                user.totp_last_used_step = step
                user.save(update_fields=['totp_last_used_step'])
            return True
    return False


def generate_backup_codes(user) -> list[str]:
    codes = [f'{secrets.token_hex(2)}-{secrets.token_hex(2)}'.upper() for _ in range(BACKUP_CODE_COUNT)]
    user.totp_backup_codes = [make_password(_normalize(c)) for c in codes]
    return codes


def use_backup_code(user, code) -> bool:
    code = _normalize(code)
    if len(code) != 8:
        return False
    for stored in list(user.totp_backup_codes or []):
        if check_password(code, stored):
            user.totp_backup_codes = [c for c in user.totp_backup_codes if c != stored]
            user.save(update_fields=['totp_backup_codes'])
            return True
    return False


def verify_second_factor(user, code) -> bool:
    return verify_totp(user, code) or use_backup_code(user, code)


def make_login_token(user) -> str:
    # Lié au hash du mot de passe : un changement de mot de passe invalide les jetons en vol.
    return signing.dumps({'uid': user.pk, 'pw': user.password[-12:]}, salt=_LOGIN_TOKEN_SALT)


def read_login_token(token, user_model):
    try:
        data = signing.loads(token, salt=_LOGIN_TOKEN_SALT, max_age=settings.MFA_LOGIN_TOKEN_MAX_AGE_SECONDS)
        user = user_model.objects.get(pk=data['uid'], is_active=True)
    except (signing.BadSignature, user_model.DoesNotExist, KeyError, TypeError):
        return None
    if not secrets.compare_digest(user.password[-12:], data.get('pw', '')):
        return None
    return user
