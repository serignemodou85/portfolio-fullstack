// src/app/core/services/experience.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ExperienceItem } from '../models/experience.model';

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {
  private apiUrl = `${environment.apiUrl}/experiences`;

  constructor(private http: HttpClient) {}

  getExperiences(): Observable<ExperienceItem[]> {
    return this.http.get<ExperienceItem[] | PaginatedResponse<ExperienceItem>>(`${this.apiUrl}/`).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  createExperience(payload: FormData): Observable<ExperienceItem> {
    return this.http.post<ExperienceItem>(`${this.apiUrl}/`, payload);
  }

  updateExperience(id: number, payload: FormData): Observable<ExperienceItem> {
    return this.http.put<ExperienceItem>(`${this.apiUrl}/${id}/`, payload);
  }

  deleteExperience(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
