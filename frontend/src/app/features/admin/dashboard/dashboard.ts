// src/app/features/admin/dashboard/dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ProjectService } from '../../projects/services/project';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';
import { User } from '../../../core/models/auth.model';
import { ProjectList } from '../../../core/models/project.model';
import { ContactMessage } from '../../../core/models/contact.model';
import { HttpClientModule } from '@angular/common/http';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { ContactService } from '../../../core/services/contact.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule, IconComponent, AdminShell],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;
  recentProjects: ProjectList[] = [];
  archivedProjects: ProjectList[] = [];
  activeProjects: ProjectList[] = [];
  recentMessages: ContactMessage[] = [];
  loadingMessages = false;
  messagesError: string | null = null;
  stats: DashboardStats = {
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    totalViews: 0,
    totalArticles: 0,
    viewsGrowth: 0,
    activeProjects: 0,
    unreadMessages: 0
  };
  loading = true;
  pageSize = 5;
  pageSizeOptions = [4, 5, 10, 20];
  projectPage = 1;
  messagePage = 1;
  projectSearch = '';
  messageSearch = '';
  projectSort: 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc' = 'updated_desc';
  messageSort: 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' = 'date_desc';

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private contactService: ContactService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
    this.loadStatsFromAPI();
    this.loadRecentMessages();
  }

  loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadDashboardData(): void {
    this.projectService.getProjects({ page_size: 1000 }).subscribe({
      next: (projects) => {
        this.activeProjects = projects.filter(p => p.status !== 'archived');
        this.archivedProjects = projects.filter(p => p.status === 'archived');
        this.recentProjects = this.activeProjects;
        this.stats.totalProjects = projects.length;
        this.stats.completedProjects = projects.filter(p => p.status === 'completed').length;
        this.stats.inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
        this.stats.activeProjects = this.activeProjects.length;
        this.syncProjectPage();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement projets:', err);
        this.loading = false;
      }
    });
  }

  loadStatsFromAPI(): void {
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats; // Mise à jour dynamique depuis Django
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
      }
    });
  }

  loadRecentMessages(): void {
    this.loadingMessages = true;
    this.messagesError = null;

    this.contactService.getMessages({ page_size: 1000 }).subscribe({
      next: (messages) => {
        this.recentMessages = messages;
        this.syncMessagePage();
        this.loadingMessages = false;
      },
      error: (err) => {
        console.error('Erreur chargement messages:', err);
        this.messagesError = 'Impossible de charger les messages.';
        this.loadingMessages = false;
      }
    });
  }

  get pagedProjects(): ProjectList[] {
    return this.paginate(this.processedProjects, this.projectPage);
  }

  get pagedMessages(): ContactMessage[] {
    return this.paginate(this.processedMessages, this.messagePage);
  }

  get projectTotalPages(): number {
    return Math.max(1, Math.ceil(this.processedProjects.length / this.pageSize));
  }

  get messageTotalPages(): number {
    return Math.max(1, Math.ceil(this.processedMessages.length / this.pageSize));
  }

  setProjectPage(page: number): void {
    this.projectPage = this.clampPage(page, this.projectTotalPages);
  }

  setMessagePage(page: number): void {
    this.messagePage = this.clampPage(page, this.messageTotalPages);
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.syncProjectPage();
    this.syncMessagePage();
  }

  get processedProjects(): ProjectList[] {
    const query = this.projectSearch.trim().toLowerCase();
    let items = this.recentProjects;
    if (query) {
      items = items.filter((project) =>
        [project.title, project.description, project.technologies]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query))
      );
    }
    return this.sortProjects(items);
  }

  get processedMessages(): ContactMessage[] {
    const query = this.messageSearch.trim().toLowerCase();
    let items = this.recentMessages;
    if (query) {
      items = items.filter((message) =>
        [message.name, message.email, message.subject, message.message]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query))
      );
    }
    return this.sortMessages(items);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  archiveProject(project: ProjectList): void {
    if (!project?.slug) {
      return;
    }

    const confirmed = window.confirm('Archiver ce projet ?');
    if (!confirmed) {
      return;
    }

    const payload = new FormData();
    payload.append('status', 'archived');

    this.projectService.partialUpdateProject(project.slug, payload).subscribe({
      next: (updated) => {
        this.activeProjects = this.activeProjects.filter((item) => item.slug !== updated.slug);
        this.archivedProjects = [updated, ...this.archivedProjects.filter((item) => item.slug !== updated.slug)];
        this.recentProjects = this.activeProjects;
        this.stats.totalProjects = this.activeProjects.length + this.archivedProjects.length;
        this.stats.activeProjects = this.activeProjects.length;
        this.stats.completedProjects = this.activeProjects.filter((p) => p.status === 'completed').length;
        this.stats.inProgressProjects = this.activeProjects.filter((p) => p.status === 'in_progress').length;
        this.syncProjectPage();
      },
      error: (err) => {
        console.error('Erreur archivage projet:', err);
      }
    });
  }

  markMessageAsRead(message: ContactMessage): void {
    if (!message?.id) {
      return;
    }

    this.contactService.markRead(message.id).subscribe({
      next: () => {
        const wasNew = message.status === 'new';
        message.status = 'read';
        if (wasNew) {
          this.stats.unreadMessages = Math.max((this.stats.unreadMessages || 0) - 1, 0);
        }
      },
      error: (err) => {
        console.error('Erreur mark read:', err);
      }
    });
  }

  replyToMessage(message: ContactMessage): void {
    if (!message?.id) {
      return;
    }

    const reply = window.prompt(`Reponse pour ${message.email}`);
    if (!reply || !reply.trim()) {
      return;
    }

    this.contactService.reply(message.id, reply.trim()).subscribe({
      next: () => {
        const wasNew = message.status === 'new';
        message.status = 'replied';
        if (wasNew) {
          this.stats.unreadMessages = Math.max((this.stats.unreadMessages || 0) - 1, 0);
        }
        window.alert('Reponse envoyee par email.');
      },
      error: (err) => {
        console.error('Erreur reply:', err);
        window.alert('Echec envoi reponse.');
      }
    });
  }

  archiveMessage(message: ContactMessage): void {
    if (!message?.id) {
      return;
    }

    this.contactService.archive(message.id).subscribe({
      next: () => {
        const wasNew = message.status === 'new';
        message.status = 'archived';
        if (wasNew) {
          this.stats.unreadMessages = Math.max((this.stats.unreadMessages || 0) - 1, 0);
        }
      },
      error: (err) => {
        console.error('Erreur archive message:', err);
      }
    });
  }

  deleteMessage(message: ContactMessage): void {
    if (!message?.id) {
      return;
    }

    const confirmed = window.confirm('Supprimer ce message definitivement ?');
    if (!confirmed) {
      return;
    }

    this.contactService.deleteMessage(message.id).subscribe({
      next: () => {
        const wasNew = message.status === 'new';
        this.recentMessages = this.recentMessages.filter((item) => item.id !== message.id);
        this.syncMessagePage();
        if (wasNew) {
          this.stats.unreadMessages = Math.max((this.stats.unreadMessages || 0) - 1, 0);
        }
      },
      error: (err) => {
        console.error('Erreur suppression message:', err);
        window.alert('Suppression impossible.');
      }
    });
  }

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private clampPage(page: number, total: number): number {
    return Math.min(Math.max(page, 1), total);
  }

  private syncProjectPage(): void {
    this.projectPage = this.clampPage(this.projectPage, this.projectTotalPages);
  }

  private syncMessagePage(): void {
    this.messagePage = this.clampPage(this.messagePage, this.messageTotalPages);
  }

  private sortProjects(items: ProjectList[]): ProjectList[] {
    return [...items].sort((a, b) => {
      if (this.projectSort === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (this.projectSort === 'title_desc') {
        return b.title.localeCompare(a.title);
      }
      const dateA = new Date(a.updated_at || '').getTime();
      const dateB = new Date(b.updated_at || '').getTime();
      if (this.projectSort === 'updated_asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }

  private sortMessages(items: ContactMessage[]): ContactMessage[] {
    return [...items].sort((a, b) => {
      if (this.messageSort === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (this.messageSort === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      const dateA = new Date(a.created_at || '').getTime();
      const dateB = new Date(b.created_at || '').getTime();
      if (this.messageSort === 'date_asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }

  trackByProject(index: number, item: ProjectList): string {
    return item.slug || `${index}`;
  }

  trackByMessage(index: number, item: ContactMessage): number {
    return item.id ?? index;
  }
}
