// src/app/core/services/auth.service.ts
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getAccessToken();
    const refresh = this.getRefreshToken();

    if (!token) {
      return;
    }

    if (this.isTokenExpired(token)) {
      if (refresh && !this.isTokenExpired(refresh)) {
        this.refreshToken().subscribe({
          next: () => this.loadCurrentUser(),
          error: () => this.logout()
        });
      } else {
        this.logout();
      }
      return;
    }

    this.loadCurrentUser();
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${environment.authUrl}/login/`, credentials)
      .pipe(
        tap(response => {
          this.setTokens(response.access, response.refresh);
          this.loadCurrentUser();
        })
      );
  }

  requestPasswordReset(payload: PasswordResetRequestPayload): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${environment.authUrl}/password-reset/request/`, payload);
  }

  confirmPasswordReset(payload: PasswordResetConfirmPayload): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${environment.authUrl}/password-reset/confirm/`, payload);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<TokenResponse>(`${environment.authUrl}/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        this.setAccessToken(response.access);
      })
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me/`).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  getCurrentUserSnapshot(): User | null {
    return this.currentUserSubject.value;
  }

  private loadCurrentUser(): void {
    this.fetchCurrentUser().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: (err) => {
        if (err?.status === 401 && this.getRefreshToken()) {
          this.refreshToken().subscribe({
            next: () => this.loadCurrentUser(),
            error: () => this.logout()
          });
          return;
        }
        // Ne pas invalider la session locale sur erreur reseau/serveur.
        // On garde les tokens et on retentera au prochain appel.
        if (err?.status === 401 || err?.status === 403) {
          this.logout();
        }
      }
    });
  }

  private setTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  private setAccessToken(access: string): void {
    localStorage.setItem('access_token', access);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) {
        return true;
      }

      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized);
      const payload = JSON.parse(json);
      const exp = Number(payload?.exp);
      if (!exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return now >= exp;
    } catch {
      return true;
    }
  }
}
