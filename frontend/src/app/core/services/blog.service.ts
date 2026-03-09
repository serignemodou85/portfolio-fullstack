// src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getCategories(): Observable<BlogCategory[]> {
    return this.http.get<BlogCategory[]>(`${this.categoriesUrl}/`);
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

  getTags(): Observable<BlogTag[]> {
    return this.http.get<BlogTag[]>(`${this.tagsUrl}/`);
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

  getArticles(): Observable<ArticleList[]> {
    return this.http.get<ArticleList[]>(`${this.articlesUrl}/`);
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
