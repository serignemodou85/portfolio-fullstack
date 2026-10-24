// src/app/core/services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  totalViews: number;
  totalArticles: number;
  viewsGrowth?: number;
  activeProjects?: number;
  unreadMessages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  private API_URL = `${environment.apiUrl}/dashboard/stats/`;

  /**
   * Récupère les stats du dashboard depuis Django
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.API_URL);
  }
}
