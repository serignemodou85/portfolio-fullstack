import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/paginated-response.model';

export interface AuditChange {
  old: unknown;
  new: unknown;
}

export interface AuditLogEntry {
  id: number;
  username: string;
  action: string;
  action_label: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, AuditChange | unknown>;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);

  list(page: number, action?: string): Observable<PaginatedResponse<AuditLogEntry>> {
    let params = new HttpParams().set('page', page).set('page_size', 25);
    if (action) {
      params = params.set('action', action);
    }
    return this.http.get<PaginatedResponse<AuditLogEntry>>(`${environment.apiUrl}/audit-logs/`, { params });
  }
}
