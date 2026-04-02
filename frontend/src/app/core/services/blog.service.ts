// src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ArticleList, ArticleDetail } from '../models/article.model';
import { BlogCategory, BlogTag } from '../models/blog.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private categoriesUrl = `${environment.apiUrl}/blog/categories`;
  private tagsUrl = `${environment.apiUrl}/blog/tags`;
  private articlesUrl = `${environment.apiUrl}/blog/articles`;

  constructor(private http: HttpClient) {}

  getCategories(options?: { page?: number; page_size?: number }): Observable<BlogCategory[]> {
    let params = new HttpParams();
    if (options?.page) {
      params = params.set('page', String(options.page));
    }
    if (options?.page_size) {
      params = params.set('page_size', String(options.page_size));
    }
    return this.http.get<BlogCategory[] | PaginatedResponse<BlogCategory>>(`${this.categoriesUrl}/`, { params }).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  createCategory(payload: Partial<BlogCategory>): Observable<BlogCategory> {
    return this.http.post<BlogCategory>(`${this.categoriesUrl}/`, payload);
  }

  updateCategory(slug: string, payload: Partial<BlogCategory>): Observable<BlogCategory> {
    return this.http.put<BlogCategory>(`${this.categoriesUrl}/${slug}/`, payload);
  }

  deleteCategory(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${slug}/`);
  }

  getTags(options?: { page?: number; page_size?: number }): Observable<BlogTag[]> {
    let params = new HttpParams();
    if (options?.page) {
      params = params.set('page', String(options.page));
    }
    if (options?.page_size) {
      params = params.set('page_size', String(options.page_size));
    }
    return this.http.get<BlogTag[] | PaginatedResponse<BlogTag>>(`${this.tagsUrl}/`, { params }).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  createTag(payload: Partial<BlogTag>): Observable<BlogTag> {
    return this.http.post<BlogTag>(`${this.tagsUrl}/`, payload);
  }

  updateTag(slug: string, payload: Partial<BlogTag>): Observable<BlogTag> {
    return this.http.put<BlogTag>(`${this.tagsUrl}/${slug}/`, payload);
  }

  deleteTag(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.tagsUrl}/${slug}/`);
  }

  getArticles(options?: { page?: number; page_size?: number }): Observable<ArticleList[]> {
    let params = new HttpParams();
    if (options?.page) {
      params = params.set('page', String(options.page));
    }
    if (options?.page_size) {
      params = params.set('page_size', String(options.page_size));
    }
    return this.http.get<ArticleList[] | PaginatedResponse<ArticleList>>(`${this.articlesUrl}/`, { params }).pipe(
      map((res) => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  getArticle(slug: string): Observable<ArticleDetail> {
    return this.http.get<ArticleDetail>(`${this.articlesUrl}/${slug}/`);
  }

  createArticle(payload: FormData): Observable<ArticleDetail> {
    return this.http.post<ArticleDetail>(`${this.articlesUrl}/`, payload);
  }

  updateArticle(slug: string, payload: FormData): Observable<ArticleDetail> {
    return this.http.put<ArticleDetail>(`${this.articlesUrl}/${slug}/`, payload);
  }

  partialUpdateArticle(slug: string, payload: FormData): Observable<ArticleDetail> {
    return this.http.patch<ArticleDetail>(`${this.articlesUrl}/${slug}/`, payload);
  }

  deleteArticle(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.articlesUrl}/${slug}/`);
  }
}

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}
