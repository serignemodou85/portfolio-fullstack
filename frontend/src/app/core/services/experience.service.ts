// src/app/core/services/experience.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, EMPTY, of } from 'rxjs';
import { expand, map, reduce, switchMap } from 'rxjs/operators';
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

  getExperiences(options?: { page?: number; page_size?: number }): Observable<ExperienceItem[]> {
    let params = new HttpParams();
    if (options?.page) {
      params = params.set('page', String(options.page));
    }
    if (options?.page_size) {
      params = params.set('page_size', String(options.page_size));
    }
    return this.http.get<ExperienceItem[] | PaginatedResponse<ExperienceItem>>(`${this.apiUrl}/`, { params }).pipe(
      switchMap((res) => {
        if (Array.isArray(res)) {
          return of(res);
        }
        if (!res?.next) {
          return of(res?.results ?? []);
        }
        return this.fetchAllPages(res);
      })
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

  private fetchAllPages(initial: PaginatedResponse<ExperienceItem>): Observable<ExperienceItem[]> {
    return of(initial).pipe(
      expand((page) => page.next ? this.http.get<PaginatedResponse<ExperienceItem>>(page.next) : EMPTY),
      map((page) => page.results ?? []),
      reduce((acc, items) => acc.concat(items), [] as ExperienceItem[])
    );
  }
}
