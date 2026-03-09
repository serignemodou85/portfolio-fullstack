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

  constructor(private http: HttpClient) {}

  getProjects(filters?: { status?: string; is_featured?: boolean }): Observable<ProjectList[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.is_featured !== undefined) {
      params = params.set('is_featured', filters.is_featured.toString());
    }
    return this.http.get<ProjectList[] | PaginatedResponse<ProjectList>>(this.apiUrl, { params }).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? []))
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

  deleteProject(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${slug}/`);
  }
}
