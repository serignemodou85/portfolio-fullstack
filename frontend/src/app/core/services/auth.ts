// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, TokenResponse, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getAccessToken();
    if (token) {
      this.loadCurrentUser();
    }
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
    return !!this.getAccessToken();
  }
}
