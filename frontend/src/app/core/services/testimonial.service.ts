import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/paginated-response.model';

export interface Testimonial {
  id: number;
  author_name: string;
  author_role: string;
  company: string;
  content: string;
  avatar: string | null;
  linkedin_url: string;
  is_published: boolean;
  order: number;
  created_at: string;
}

export interface GithubRepo {
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  pushed_at: string;
}

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/testimonials/`;

  list(): Observable<Testimonial[]> {
    return this.http
      .get<Testimonial[] | PaginatedResponse<Testimonial>>(this.url, { params: { page_size: 100 } })
      .pipe(map(res => (Array.isArray(res) ? res : res.results)));
  }

  create(payload: FormData): Observable<Testimonial> {
    return this.http.post<Testimonial>(this.url, payload);
  }

  update(id: number, payload: FormData | Partial<Testimonial>): Observable<Testimonial> {
    return this.http.patch<Testimonial>(`${this.url}${id}/`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }

  githubRepos(): Observable<{ username: string; repos: GithubRepo[] }> {
    return this.http.get<{ username: string; repos: GithubRepo[] }>(`${environment.apiUrl}/github/repos/`);
  }
}
