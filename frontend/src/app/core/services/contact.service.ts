import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ContactMessage } from '../models/contact.model';

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contact`;

  constructor(private http: HttpClient) {}

  getMessages(): Observable<ContactMessage[]> {
    return this.http
      .get<ContactMessage[] | PaginatedResponse<ContactMessage>>(`${this.apiUrl}/`)
      .pipe(map((res) => (Array.isArray(res) ? res : (res.results ?? []))));
  }

  markRead(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/${id}/mark_read/`, {});
  }

  archive(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/${id}/archive/`, {});
  }

  reply(id: number, replyMessage: string): Observable<{ status: string; detail: string }> {
    return this.http.post<{ status: string; detail: string }>(`${this.apiUrl}/${id}/reply/`, {
      reply_message: replyMessage
    });
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
