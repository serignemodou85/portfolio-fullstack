// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getPublicProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/public_profile/`);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me/`);
  }

  updateMe(payload: FormData | Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me/`, payload);
  }
}
