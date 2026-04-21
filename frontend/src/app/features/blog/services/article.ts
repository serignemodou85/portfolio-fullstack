// src/app/features/blog/services/article.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ArticleList, ArticleDetail } from '../../../core/models/article.model';

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
export class ArticleService {
  private apiUrl = `${environment.apiUrl}/blog/articles`;
  private featuredCache: { ts: number; data: ArticleList[] } | null = null;
  private listCache: { ts: number; data: ArticleList[] } | null = null;
  private cacheTtlMs = 600_000; // 10 min

  constructor(private http: HttpClient) {}

  private toArray<T>(res: T[] | PaginatedResponse<T>): T[] {
    return Array.isArray(res) ? res : (res.results ?? []);
  }

  getArticles(): Observable<ArticleList[]> {
    if (this.listCache && Date.now() - this.listCache.ts < this.cacheTtlMs) {
      return of(this.listCache.data);
    }
    return this.http.get<ArticleList[] | PaginatedResponse<ArticleList>>(this.apiUrl).pipe(
      map((res) => this.toArray(res)),
      map((items) => {
        this.listCache = { ts: Date.now(), data: items };
        return items;
      })
    );
  }

  getFeaturedArticles(): Observable<ArticleList[]> {
    if (this.featuredCache && Date.now() - this.featuredCache.ts < this.cacheTtlMs) {
      return of(this.featuredCache.data);
    }
    return this.http.get<ArticleList[] | PaginatedResponse<ArticleList>>(`${this.apiUrl}/featured/`).pipe(
      map((res) => this.toArray(res)),
      map((items) => {
        this.featuredCache = { ts: Date.now(), data: items };
        return items;
      })
    );
  }

  getArticleBySlug(slug: string): Observable<ArticleDetail> {
    return this.http.get<ArticleDetail>(`${this.apiUrl}/${slug}/`);
  }
}
