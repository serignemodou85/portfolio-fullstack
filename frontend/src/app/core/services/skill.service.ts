// src/app/core/services/skill.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SkillCategory, SkillCategoryWithSkills, SkillItem } from '../models/skill.model';
import { PaginatedResponse } from '../models/paginated-response.model';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private categoriesUrl = `${environment.apiUrl}/skill-categories`;
  private skillsUrl = `${environment.apiUrl}/skills`;
  private withSkillsCache: { ts: number; data: SkillCategoryWithSkills[] } | null = null;
  private readonly cacheTtlMs = 600_000; // 10 min

  constructor(private http: HttpClient) {}

  getCategories(options?: { page?: number; page_size?: number }): Observable<SkillCategory[]> {
    let params = new HttpParams();
    if (options?.page) {
      params = params.set('page', String(options.page));
    }
    if (options?.page_size) {
      params = params.set('page_size', String(options.page_size));
    }
    return this.http.get<SkillCategory[] | PaginatedResponse<SkillCategory>>(`${this.categoriesUrl}/`, { params }).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  getCategoriesWithSkills(): Observable<SkillCategoryWithSkills[]> {
    if (this.withSkillsCache && Date.now() - this.withSkillsCache.ts < this.cacheTtlMs) {
      return of(this.withSkillsCache.data);
    }
    return this.http.get<SkillCategoryWithSkills[]>(`${this.categoriesUrl}/with_skills/`).pipe(
      tap((data) => { this.withSkillsCache = { ts: Date.now(), data }; })
    );
  }

  createCategory(payload: Partial<SkillCategory>): Observable<SkillCategory> {
    return this.http.post<SkillCategory>(`${this.categoriesUrl}/`, payload);
  }

  updateCategory(id: number, payload: Partial<SkillCategory>): Observable<SkillCategory> {
    return this.http.put<SkillCategory>(`${this.categoriesUrl}/${id}/`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}/`);
  }

  getSkills(options?: { page?: number; page_size?: number }): Observable<SkillItem[]> {
    let params = new HttpParams();
    if (options?.page) {
      params = params.set('page', String(options.page));
    }
    if (options?.page_size) {
      params = params.set('page_size', String(options.page_size));
    }
    return this.http.get<SkillItem[] | PaginatedResponse<SkillItem>>(`${this.skillsUrl}/`, { params }).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  createSkill(payload: Partial<SkillItem>): Observable<SkillItem> {
    return this.http.post<SkillItem>(`${this.skillsUrl}/`, payload);
  }

  updateSkill(id: number, payload: Partial<SkillItem>): Observable<SkillItem> {
    return this.http.put<SkillItem>(`${this.skillsUrl}/${id}/`, payload);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.skillsUrl}/${id}/`);
  }
}
