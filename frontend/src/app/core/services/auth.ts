import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  MfaSetupResponse,
  TokenResponse,
  User,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
  isMfaChallenge
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Access token en mémoire uniquement — invisible au JS après rechargement de page.
  // La session est restaurée par le cookie HttpOnly de refresh via refreshToken().
  private _accessToken: string | null = null;

  // Refresh en cours, partagé : avec la rotation + blacklist côté serveur, deux refresh
  // parallèles feraient échouer le second (jeton déjà consommé) et déconnecteraient l'admin.
  private refreshInFlight$: Observable<TokenResponse> | null = null;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.authUrl}/login/`, credentials, { withCredentials: true })
      .pipe(tap(res => {
        if (!isMfaChallenge(res)) {
          this.startSession(res.access);
        }
      }));
  }

  verifyMfa(mfaToken: string, code: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.authUrl}/2fa/verify/`, { mfa_token: mfaToken, code }, { withCredentials: true })
      .pipe(tap(res => this.startSession(res.access)));
  }

  logout(): void {
    this._accessToken = null;
    this.currentUserSubject.next(null);
    this.http.post(`${environment.authUrl}/logout/`, {}, { withCredentials: true }).subscribe();
  }

  refreshToken(): Observable<TokenResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<TokenResponse>(`${environment.authUrl}/refresh/`, {}, { withCredentials: true })
        .pipe(
          tap(res => { this._accessToken = res.access; }),
          finalize(() => { this.refreshInFlight$ = null; }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.refreshInFlight$;
  }

  setupMfa(): Observable<MfaSetupResponse> {
    return this.http.post<MfaSetupResponse>(`${environment.authUrl}/2fa/setup/`, {});
  }

  enableMfa(code: string): Observable<{ backup_codes: string[] }> {
    return this.http
      .post<{ backup_codes: string[] }>(`${environment.authUrl}/2fa/enable/`, { code })
      .pipe(tap(() => this.patchCurrentUser({ totp_enabled: true })));
  }

  disableMfa(code: string): Observable<{ detail: string }> {
    return this.http
      .post<{ detail: string }>(`${environment.authUrl}/2fa/disable/`, { code })
      .pipe(tap(() => this.patchCurrentUser({ totp_enabled: false })));
  }

  requestPasswordReset(payload: PasswordResetRequestPayload): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${environment.authUrl}/password-reset/request/`, payload);
  }

  confirmPasswordReset(payload: PasswordResetConfirmPayload): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${environment.authUrl}/password-reset/confirm/`, payload);
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me/`).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  getCurrentUserSnapshot(): User | null {
    return this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return this._accessToken;
  }

  isAuthenticated(): boolean {
    return !!this._accessToken && !this.isTokenExpired(this._accessToken);
  }

  private startSession(access: string): void {
    this._accessToken = access;
    this.fetchCurrentUser().subscribe({ error: () => {} });
  }

  private patchCurrentUser(patch: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (current) {
      this.currentUserSubject.next({ ...current, ...patch });
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return Math.floor(Date.now() / 1000) >= Number(payload?.exp);
    } catch {
      return true;
    }
  }
}
