// src/app/features/admin/dashboard/dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ProjectService } from '../../projects/services/project';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';
import { User } from '../../../core/models/auth.model';
import { ProjectList } from '../../../core/models/project.model';
import { ContactMessage } from '../../../core/models/contact.model';
import { HttpClientModule } from '@angular/common/http';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ContactService } from '../../../core/services/contact.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule, IconComponent],
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
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.activeProjects = projects.filter(p => p.status !== 'archived');
        this.archivedProjects = projects.filter(p => p.status === 'archived');
        this.recentProjects = this.activeProjects.slice(0, 6);
        this.stats.totalProjects = projects.length;
        this.stats.completedProjects = projects.filter(p => p.status === 'completed').length;
        this.stats.inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
        this.stats.activeProjects = this.activeProjects.length;
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

    this.contactService.getMessages().subscribe({
      next: (messages) => {
        this.recentMessages = messages.slice(0, 5);
        this.loadingMessages = false;
      },
      error: (err) => {
        console.error('Erreur chargement messages:', err);
        this.messagesError = 'Impossible de charger les messages.';
        this.loadingMessages = false;
      }
    });
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
        this.recentProjects = this.activeProjects.slice(0, 6);
        this.stats.totalProjects = this.activeProjects.length + this.archivedProjects.length;
        this.stats.activeProjects = this.activeProjects.length;
        this.stats.completedProjects = this.activeProjects.filter((p) => p.status === 'completed').length;
        this.stats.inProgressProjects = this.activeProjects.filter((p) => p.status === 'in_progress').length;
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
}
