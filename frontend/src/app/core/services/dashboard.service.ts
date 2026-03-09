// src/app/core/services/dashboard.service.ts
import { Injectable } from '@angular/core';
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
  private API_URL = `${environment.apiUrl}/dashboard/stats/`; // Endpoint Django REST

  constructor(private http: HttpClient) {}

  /**
   * Récupère les stats du dashboard depuis Django
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.API_URL);
  }
}
