import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  TokenResponse,
  User,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Access token en mémoire uniquement — invisible au JS après rechargement de page.
  // La session est restaurée par le cookie HttpOnly refresh_token via refreshToken().
  private _accessToken: string | null = null;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.authUrl}/login/`, credentials, { withCredentials: true })
      .pipe(tap(res => {
        this._accessToken = res.access;
        this.loadCurrentUser();
      }));
  }

  logout(): void {
    this._accessToken = null;
    this.currentUserSubject.next(null);
    this.http.post(`${environment.authUrl}/logout/`, {}, { withCredentials: true }).subscribe();
  }

  refreshToken(): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.authUrl}/refresh/`, {}, { withCredentials: true })
      .pipe(tap(res => { this._accessToken = res.access; }));
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

  private loadCurrentUser(): void {
    this.fetchCurrentUser().subscribe({ error: () => {} });
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
