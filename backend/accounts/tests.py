import time

import pyotp
from django.conf import settings
from django.core import mail
from django.core.cache import caches
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import AuditLog, User

PASSWORD = 'Sup3r-Secret-Pass!'


def make_admin(**extra):
    defaults = dict(username='admin', email='admin@example.com', is_staff=True, is_superuser=True)
    defaults.update(extra)
    return User.objects.create_user(password=PASSWORD, **defaults)


class BaseAPITest(TestCase):
    def setUp(self):
        caches['default'].clear()   # compteurs de throttling DRF
        caches['security'].clear()  # compteurs de verrouillage
        self.client = APIClient()

    def login(self, username='admin', password=PASSWORD):
        return self.client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')

    def bearer(self, access):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')


class LoginLockoutTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.user = make_admin()

    def test_locks_after_max_failures_even_with_right_password(self):
        for _ in range(settings.LOGIN_LOCKOUT_MAX_ATTEMPTS):
            self.assertEqual(self.login(password='wrong').status_code, 401)
        self.assertEqual(self.login().status_code, 429)
        self.assertTrue(AuditLog.objects.filter(action='login_locked').exists())

    def test_username_and_email_share_the_same_counter(self):
        for i in range(settings.LOGIN_LOCKOUT_MAX_ATTEMPTS):
            ident = 'admin' if i % 2 else 'ADMIN@example.com'
            self.login(username=ident, password='wrong')
        self.assertEqual(self.login(username='admin@example.com').status_code, 429)

    def test_success_resets_counter(self):
        for _ in range(settings.LOGIN_LOCKOUT_MAX_ATTEMPTS - 1):
            self.login(password='wrong')
        self.assertEqual(self.login().status_code, 200)
        for _ in range(settings.LOGIN_LOCKOUT_MAX_ATTEMPTS - 1):
            self.login(password='wrong')
        self.assertEqual(self.login().status_code, 200)


class RefreshCookieTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        make_admin()

    def test_refresh_cookie_is_httponly_and_scoped_to_auth_endpoints(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        cookie = response.cookies[settings.REFRESH_COOKIE_NAME]
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['path'], '/api/auth/')

    def test_rotation_revokes_previous_token(self):
        first = self.login().cookies[settings.REFRESH_COOKIE_NAME].value
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 200)
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = first
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 401)

    def test_logout_revokes_refresh_token(self):
        token = self.login().cookies[settings.REFRESH_COOKIE_NAME].value
        self.client.post('/api/auth/logout/')
        # Un attaquant qui aurait copié le cookie avant la déconnexion ne peut plus s'en servir.
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = token
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 401)


class MfaTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.user = make_admin()
        self.bearer(self.login().data['access'])
        setup = self.client.post('/api/auth/2fa/setup/')
        self.assertEqual(setup.status_code, 200)
        self.assertTrue(setup.data['qr_code'].startswith('data:image/svg+xml'))
        self.totp = pyotp.TOTP(setup.data['secret'])
        enabled = self.client.post('/api/auth/2fa/enable/', {'code': self.totp.now()}, format='json')
        self.assertEqual(enabled.status_code, 200)
        self.backup_codes = enabled.data['backup_codes']
        self.client.credentials()
        self.user.refresh_from_db()

    def _fresh_code(self):
        # Le code courant vient d'être consommé par l'activation : on prend le suivant.
        return self.totp.at(time.time() + self.totp.interval)

    def test_secret_encrypted_and_backup_codes_hashed_at_rest(self):
        with connection.cursor() as cur:
            cur.execute('SELECT totp_secret FROM accounts_user WHERE id = %s', [self.user.pk])
            raw = cur.fetchone()[0]
        self.assertNotEqual(raw, self.user.totp_secret)
        self.assertTrue(raw.startswith('gAAAA'))
        self.assertEqual(len(self.user.totp_backup_codes), 8)
        self.assertNotIn(self.backup_codes[0], str(self.user.totp_backup_codes))

    def test_password_alone_no_longer_issues_tokens(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['mfa_required'])
        self.assertNotIn('access', response.data)
        self.assertNotIn(settings.REFRESH_COOKIE_NAME, response.cookies)

    def test_valid_code_completes_login_and_cannot_be_replayed(self):
        token = self.login().data['mfa_token']
        code = self._fresh_code()
        ok = self.client.post('/api/auth/2fa/verify/', {'mfa_token': token, 'code': code}, format='json')
        self.assertEqual(ok.status_code, 200)
        self.assertIn('access', ok.data)

        token = self.login().data['mfa_token']
        replay = self.client.post('/api/auth/2fa/verify/', {'mfa_token': token, 'code': code}, format='json')
        self.assertEqual(replay.status_code, 401)

    def test_backup_code_is_single_use(self):
        code = self.backup_codes[0]
        token = self.login().data['mfa_token']
        self.assertEqual(self.client.post('/api/auth/2fa/verify/', {'mfa_token': token, 'code': code}, format='json').status_code, 200)
        token = self.login().data['mfa_token']
        self.assertEqual(self.client.post('/api/auth/2fa/verify/', {'mfa_token': token, 'code': code}, format='json').status_code, 401)

    def test_wrong_codes_lock_the_account(self):
        token = self.login().data['mfa_token']
        for _ in range(settings.LOGIN_LOCKOUT_MAX_ATTEMPTS):
            self.client.post('/api/auth/2fa/verify/', {'mfa_token': token, 'code': '000000'}, format='json')
        locked = self.client.post('/api/auth/2fa/verify/', {'mfa_token': token, 'code': self._fresh_code()}, format='json')
        self.assertEqual(locked.status_code, 429)

    def test_forged_login_token_rejected(self):
        response = self.client.post('/api/auth/2fa/verify/', {'mfa_token': 'forged', 'code': self._fresh_code()}, format='json')
        self.assertEqual(response.status_code, 401)


@override_settings(PASSWORD_RESET_ASYNC_EMAIL=False)
class PasswordResetTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        make_admin()

    def test_same_response_whether_account_exists_or_not(self):
        known = self.client.post('/api/auth/password-reset/request/', {'email': 'admin@example.com'}, format='json')
        unknown = self.client.post('/api/auth/password-reset/request/', {'email': 'nobody@example.com'}, format='json')
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_response_never_faster_than_floor(self):
        started = time.monotonic()
        self.client.post('/api/auth/password-reset/request/', {'email': 'nobody@example.com'}, format='json')
        self.assertGreaterEqual(time.monotonic() - started, settings.PASSWORD_RESET_MIN_RESPONSE_SECONDS)


class ProfilePrivacyTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.user = make_admin(phone='+33600000000', location='Lyon')

    def test_public_profile_hides_private_fields(self):
        response = self.client.get('/api/users/public_profile/')
        self.assertEqual(response.status_code, 200)
        for field in ('email', 'phone', 'totp_secret', 'totp_backup_codes', 'is_staff'):
            self.assertNotIn(field, response.data)

    def test_phone_and_location_encrypted_at_rest(self):
        with connection.cursor() as cur:
            cur.execute('SELECT phone, location FROM accounts_user WHERE id = %s', [self.user.pk])
            phone, location = cur.fetchone()
        self.assertNotIn('33600000000', phone)
        self.assertNotIn('Lyon', location)
        self.user.refresh_from_db()
        self.assertEqual(self.user.phone, '+33600000000')


class AuditLogTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.user = make_admin()

    def test_admin_profile_change_is_logged_with_sensitive_values_masked(self):
        self.bearer(self.login().data['access'])
        response = self.client.patch('/api/users/me/', {'phone': '+33611111111', 'bio': 'Nouvelle bio'}, format='json')
        self.assertEqual(response.status_code, 200)
        entry = AuditLog.objects.get(action='update', model_name='accounts.User')
        self.assertEqual(entry.changes['bio']['new'], 'Nouvelle bio')
        self.assertNotIn('33611111111', str(entry.changes))

    def test_audit_log_endpoint_is_admin_only(self):
        self.assertEqual(self.client.get('/api/audit-logs/').status_code, 401)
        self.bearer(self.login().data['access'])
        self.assertEqual(self.client.get('/api/audit-logs/').status_code, 200)


class SecurityHeadersTests(BaseAPITest):
    def test_api_sends_csp_and_permissions_policy(self):
        response = self.client.get('/health/')
        self.assertIn("frame-ancestors 'none'", response['Content-Security-Policy'])
        self.assertIn('camera=()', response['Permissions-Policy'])
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
