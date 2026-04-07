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
  private cache = new Map<string, { ts: number; data: ExperienceItem[] }>();
  private cacheTtlMs = 60_000;

  constructor(private http: HttpClient) {}

  getExperiences(options?: { page?: number; page_size?: number }): Observable<ExperienceItem[]> {
    const cacheKey = JSON.stringify(options || {});
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.cacheTtlMs) {
      return of(cached.data);
    }
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
          this.cache.set(cacheKey, { ts: Date.now(), data: res });
          return of(res);
        }
        if (!res?.next) {
          const data = res?.results ?? [];
          this.cache.set(cacheKey, { ts: Date.now(), data });
          return of(data);
        }
        return this.fetchAllPages(res, cacheKey);
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

  private fetchAllPages(initial: PaginatedResponse<ExperienceItem>, cacheKey: string): Observable<ExperienceItem[]> {
    return of(initial).pipe(
      expand((page) => page.next ? this.http.get<PaginatedResponse<ExperienceItem>>(page.next) : EMPTY),
      map((page) => page.results ?? []),
      reduce((acc, items) => acc.concat(items), [] as ExperienceItem[]),
      map((items) => {
        this.cache.set(cacheKey, { ts: Date.now(), data: items });
        return items;
      })
    );
  }
}
