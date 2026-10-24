// src/app/features/admin/dashboard/dashboard.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ProjectService } from '../../projects/services/project';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';
import { ProjectList } from '../../../core/models/project.model';
import { ContactMessage } from '../../../core/models/contact.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { ContactService } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { LanguageService } from '../../../core/services/language.service';
import { byDate, byText, tableState } from '../../../core/utils/table-state';

type ProjectSort = 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc';
type MessageSort = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

const AVATAR_PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#6366f1'];
const MAX_ITEMS = 50;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, AdminShell, PagerComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private contactService = inject(ContactService);
  private dashboardService = inject(DashboardService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  lang = inject(LanguageService);

  readonly placeholderImage = 'assets/placeholders/project.svg';
  readonly currentUser = this.authService.currentUser;
  readonly activeProjects = signal<ProjectList[]>([]);
  readonly messages = signal<ContactMessage[]>([]);
  readonly loadingMessages = signal(false);
  readonly messagesError = signal(false);
  readonly stats = signal<DashboardStats>({
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    totalViews: 0,
    totalArticles: 0,
    activeProjects: 0,
    unreadMessages: 0
  });

  /** Boîte de réception : tout sauf les messages archivés. */
  readonly inbox = computed(() => this.messages().filter(m => m.status !== 'archived'));

  readonly today = computed(() =>
    new Date().toLocaleDateString(this.lang.lang() === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  );

  readonly projectTable = tableState<ProjectList, ProjectSort>(this.activeProjects, {
    sort: 'updated_desc',
    searchIn: p => [p.title, p.description, p.technologies],
    compare: sort => ({
      updated_desc: byDate<ProjectList>(p => p.updated_at, -1),
      updated_asc: byDate<ProjectList>(p => p.updated_at, 1),
      title_asc: byText<ProjectList>(p => p.title, 1),
      title_desc: byText<ProjectList>(p => p.title, -1),
    })[sort],
  });

  readonly messageTable = tableState<ContactMessage, MessageSort>(this.inbox, {
    sort: 'date_desc',
    searchIn: m => [m.name, m.email, m.subject, m.message],
    compare: sort => ({
      date_desc: byDate<ContactMessage>(m => m.created_at, -1),
      date_asc: byDate<ContactMessage>(m => m.created_at, 1),
      name_asc: byText<ContactMessage>(m => m.name, 1),
      name_desc: byText<ContactMessage>(m => m.name, -1),
    })[sort],
  });

  ngOnInit(): void {
    this.loadProjects();
    this.loadStats();
    this.loadMessages();
  }

  loadProjects(): void {
    this.projectService.getProjects({ page_size: MAX_ITEMS }).subscribe({
      next: (projects) => this.activeProjects.set(projects.filter(p => p.status !== 'archived')),
      error: () => this.activeProjects.set([])
    });
  }

  /** Les chiffres viennent de l'API : c'est la seule source de vérité après chaque action. */
  loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => undefined
    });
  }

  loadMessages(): void {
    this.loadingMessages.set(true);
    this.messagesError.set(false);
    this.contactService.getMessages({ page_size: MAX_ITEMS }).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.loadingMessages.set(false);
      },
      error: () => {
        this.messagesError.set(true);
        this.loadingMessages.set(false);
      }
    });
  }

  archiveProject(project: ProjectList): void {
    this.confirmService.confirm({
      title: 'Archiver le projet',
      message: `Archiver "${project.title}" ? Il sera déplacé dans les archives.`,
      confirmLabel: 'Archiver',
      danger: false
    }).subscribe(confirmed => {
      if (!confirmed) return;
      const payload = new FormData();
      payload.append('status', 'archived');
      this.projectService.partialUpdateProject(project.slug, payload).subscribe({
        next: () => {
          this.activeProjects.update(list => list.filter(item => item.slug !== project.slug));
          this.loadStats();
          this.toastService.success('Projet archivé.');
        },
        error: () => this.toastService.error('Impossible d\'archiver ce projet.')
      });
    });
  }

  markMessageAsRead(message: ContactMessage): void {
    if (!message.id) return;
    this.contactService.markRead(message.id).subscribe({
      next: () => this.afterMessageChange(message, 'read'),
      error: () => this.toastService.error('Impossible de marquer le message comme lu.')
    });
  }

  replyToMessage(message: ContactMessage): void {
    if (!message.id) return;
    this.confirmService.prompt({
      title: `Répondre à ${message.name}`,
      message: `Destinataire : ${message.email}`,
      inputLabel: 'Votre réponse',
      inputPlaceholder: 'Écrivez votre réponse...',
      confirmLabel: 'Envoyer',
      danger: false
    }).subscribe(reply => {
      if (!reply) return;
      this.contactService.reply(message.id!, reply).subscribe({
        next: () => {
          this.afterMessageChange(message, 'replied');
          this.toastService.success('Réponse envoyée par email.');
        },
        error: () => this.toastService.error('Échec de l\'envoi de la réponse.')
      });
    });
  }

  archiveMessage(message: ContactMessage): void {
    if (!message.id) return;
    this.contactService.archive(message.id).subscribe({
      next: () => {
        this.afterMessageChange(message, 'archived');
        this.toastService.success('Message archivé.');
      },
      error: () => this.toastService.error('Impossible d\'archiver ce message.')
    });
  }

  messageStatusLabel(status: ContactMessage['status']): string {
    return this.lang.t(`admin.msg.${status}`);
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  initialsColor(name: string): string {
    let h = 0;
    for (const c of name) {
      h = (h * 31 + c.charCodeAt(0)) % AVATAR_PALETTE.length;
    }
    return AVATAR_PALETTE[h];
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.endsWith(this.placeholderImage)) {
      img.src = this.placeholderImage;
    }
  }

  private afterMessageChange(message: ContactMessage, status: ContactMessage['status']): void {
    this.messages.update(list => list.map(m => (m.id === message.id ? { ...m, status } : m)));
    this.loadStats();
  }
}
