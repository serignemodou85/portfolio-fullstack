// src/app/features/projects/project-list/project-list.ts
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../services/project';
import { ProjectList as ProjectListModel } from '../../../core/models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

type StatusFilter = 'all' | 'completed' | 'in_progress';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, RevealDirective],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss'
})
export class ProjectList implements OnInit {
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly placeholderImage = 'assets/placeholders/project.svg';
  readonly filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'projects.filter.all' },
    { key: 'completed', label: 'projects.filter.done' },
    { key: 'in_progress', label: 'projects.filter.progress' },
  ];

  readonly projects = signal<ProjectListModel[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly status = signal<StatusFilter>('all');
  readonly query = signal('');

  /** Nombre de projets par statut, pour les compteurs des filtres. */
  readonly counts = computed(() => {
    const list = this.projects();
    return {
      all: list.length,
      completed: list.filter(p => p.status === 'completed').length,
      in_progress: list.filter(p => p.status === 'in_progress').length,
    } as Record<StatusFilter, number>;
  });

  readonly filtered = computed(() => {
    const status = this.status();
    const q = this.query().trim().toLowerCase();
    return this.projects().filter(p =>
      (status === 'all' || p.status === status) &&
      (!q || `${p.title} ${p.description} ${p.technologies}`.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.projectService.getProjects({ page_size: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (projects) => {
        // Côté public, les projets archivés restent masqués ; les projets mis en avant passent devant.
        const visible = projects.filter(p => p.status !== 'archived');
        this.projects.set([...visible.filter(p => p.is_featured), ...visible.filter(p => !p.is_featured)]);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  t(key: string): string {
    return this.lang.t(key);
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  reset(): void {
    this.status.set('all');
    this.query.set('');
  }

  techList(project: ProjectListModel, max = 4): string[] {
    return (project.technologies || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, max);
  }

  statusLabel(status: ProjectListModel['status']): string {
    return this.t('status.' + status);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.endsWith(this.placeholderImage)) {
      img.src = this.placeholderImage;
    }
  }
}
