export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
}

/** Mot de passe correct mais 2FA active : échanger mfa_token + code sur /2fa/verify/. */
export interface MfaChallenge {
  mfa_required: true;
  mfa_token: string;
}

export type LoginResponse = TokenResponse | MfaChallenge;

export function isMfaChallenge(res: LoginResponse): res is MfaChallenge {
  return (res as MfaChallenge).mfa_required === true;
}

export interface MfaSetupResponse {
  otpauth_uri: string;
  qr_code: string;
  secret: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  bio?: string;
  profile_picture?: string;
  cv_file?: string | null;
  phone?: string;
  location?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  totp_enabled?: boolean;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  uid: string;
  token: string;
  new_password: string;
  new_password2: string;
}
