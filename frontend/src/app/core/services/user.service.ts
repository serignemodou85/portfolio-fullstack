// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private publicProfileCache: { ts: number; data: User } | null = null;
  private cacheTtlMs = 60_000;

  constructor(private http: HttpClient) {}

  getPublicProfile(): Observable<User> {
    if (this.publicProfileCache && Date.now() - this.publicProfileCache.ts < this.cacheTtlMs) {
      return of(this.publicProfileCache.data);
    }
    return this.http.get<User>(`${this.apiUrl}/public_profile/`).pipe(
      tap((user) => {
        this.publicProfileCache = { ts: Date.now(), data: user };
      })
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me/`);
  }

  updateMe(payload: FormData | Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me/`, payload).pipe(
      tap((user) => {
        this.publicProfileCache = { ts: Date.now(), data: user };
      })
    );
  }
}
