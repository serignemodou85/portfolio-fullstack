import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../projects/services/project';
import { ProjectList } from '../../../core/models/project.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-project-archives',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, AdminShell],
  templateUrl: './project-archives.html',
  styleUrl: './project-archives.scss'
})
export class ProjectArchives implements OnInit {
  archivedProjects: ProjectList[] = [];
  loading = true;
  error: string | null = null;
  pageSize = 5;
  pageSizeOptions = [4, 5, 10, 20];
  page = 1;
  searchTerm = '';
  sortKey: 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc' = 'updated_desc';
  readonly placeholderImage = 'assets/placeholders/project.svg';
  private readonly mediaBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadArchivedProjects();
  }

  loadArchivedProjects(): void {
    this.loading = true;
    this.error = null;

    this.projectService.getProjects({ status: 'archived', page_size: 1000 }).subscribe({
      next: (projects) => {
        this.archivedProjects = projects;
        this.syncPage();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement archives:', err);
        this.error = 'Impossible de charger les projets archives.';
        this.loading = false;
      }
    });
  }

  get pagedArchives(): ProjectList[] {
    return this.paginate(this.processedArchives, this.page);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.processedArchives.length / this.pageSize));
  }

  setPage(page: number): void {
    this.page = this.clampPage(page, this.totalPages);
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.syncPage();
  }

  get processedArchives(): ProjectList[] {
    const query = this.searchTerm.trim().toLowerCase();
    let items = this.archivedProjects;
    if (query) {
      items = items.filter((project) =>
        [project.title, project.description, project.technologies]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query))
      );
    }
    return this.sortArchives(items);
  }

  restoreProject(project: ProjectList): void {
    if (!project.slug) {
      return;
    }

    const confirmed = window.confirm('Restaurer ce projet ?');
    if (!confirmed) {
      return;
    }

    const payload = new FormData();
    payload.append('status', 'in_progress');

    this.projectService.partialUpdateProject(project.slug, payload).subscribe({
      next: () => {
        this.archivedProjects = this.archivedProjects.filter((item) => item.slug !== project.slug);
      },
      error: (err) => {
        console.error('Erreur restauration projet:', err);
        window.alert('La restauration a echoue.');
      }
    });
  }

  deletePermanently(project: ProjectList): void {
    if (!project.slug) {
      return;
    }

    const confirmed = window.confirm(
      'Suppression definitive: ce projet sera efface de la base. Continuer ?'
    );
    if (!confirmed) {
      return;
    }

    this.projectService.deleteProject(project.slug).subscribe({
      next: () => {
        this.archivedProjects = this.archivedProjects.filter((item) => item.slug !== project.slug);
        this.syncPage();
      },
      error: (err) => {
        console.error('Erreur suppression definitive projet:', err);
        window.alert('La suppression definitive a echoue.');
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

  private syncPage(): void {
    this.page = this.clampPage(this.page, this.totalPages);
  }

  private sortArchives(items: ProjectList[]): ProjectList[] {
    return [...items].sort((a, b) => {
      if (this.sortKey === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (this.sortKey === 'title_desc') {
        return b.title.localeCompare(a.title);
      }
      const dateA = new Date(a.updated_at || '').getTime();
      const dateB = new Date(b.updated_at || '').getTime();
      if (this.sortKey === 'updated_asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }

  trackByProject(index: number, item: ProjectList): string {
    return item.slug || `${index}`;
  }

  getImageUrl(url?: string | null): string {
    if (!url) {
      return this.placeholderImage;
    }
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${this.mediaBase}${url}`;
    }
    return url;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }
}
