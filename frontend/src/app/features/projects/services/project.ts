// src/app/features/projects/services/project.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProjectList, ProjectDetail } from '../../../core/models/project.model';

/** Réponse paginée renvoyée par l'API Django REST */
interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects/`;
  private cache = new Map<string, { ts: number; data: ProjectList[] }>();
  private cacheTtlMs = 600_000; // 10 min

  constructor(private http: HttpClient) {}

  getProjects(filters?: { status?: string; is_featured?: boolean; page?: number; page_size?: number }): Observable<ProjectList[]> {
    const cacheKey = JSON.stringify(filters || {});
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.cacheTtlMs) {
      return new Observable<ProjectList[]>((observer) => {
        observer.next(cached.data);
        observer.complete();
      });
    }
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.is_featured !== undefined) {
      params = params.set('is_featured', filters.is_featured.toString());
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.page_size) {
      params = params.set('page_size', String(filters.page_size));
    }
    return this.http.get<ProjectList[] | PaginatedResponse<ProjectList>>(this.apiUrl, { params }).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? [])),
      map((items) => {
        this.cache.set(cacheKey, { ts: Date.now(), data: items });
        return items;
      })
    );
  }

  getProjectBySlug(slug: string): Observable<ProjectDetail> {
    return this.http.get<ProjectDetail>(`${this.apiUrl}${slug}/`);
  }

  createProject(project: FormData): Observable<ProjectDetail> {
    return this.http.post<ProjectDetail>(this.apiUrl, project);
  }

  updateProject(slug: string, project: FormData): Observable<ProjectDetail> {
    return this.http.put<ProjectDetail>(`${this.apiUrl}${slug}/`, project);
  }

  partialUpdateProject(slug: string, project: FormData): Observable<ProjectDetail> {
    return this.http.patch<ProjectDetail>(`${this.apiUrl}${slug}/`, project);
  }

  restoreProject(slug: string): Observable<ProjectDetail> {
    return this.http.post<ProjectDetail>(`${this.apiUrl}${slug}/restore/`, {});
  }

  deleteProject(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${slug}/`);
  }
}
