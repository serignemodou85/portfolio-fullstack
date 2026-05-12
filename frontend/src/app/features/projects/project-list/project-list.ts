// src/app/features/projects/project-list/project-list.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService } from '../services/project';
import { ProjectList as ProjectListModel } from '../../../core/models/project.model';
import { LanguageService, Lang } from '../../../core/services/language.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss'
})
export class ProjectList implements OnInit, OnDestroy {
  projects: ProjectListModel[] = [];
  filteredProjects: ProjectListModel[] = [];
  loading = true;
  error: string | null = null;
  selectedStatus: string = 'all';
  lang: Lang = 'fr';
  readonly placeholderImage = 'assets/placeholders/project.svg';
  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private langService: LanguageService
  ) {
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe(l => this.lang = l);
  }

  t(key: string): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        // Cote public: on masque les projets archives.
        const publicProjects = projects.filter((project) => project.status !== 'archived');
        this.projects = publicProjects;
        this.filteredProjects = publicProjects;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des projets';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    if (status === 'all') {
      this.filteredProjects = this.projects;
    } else {
      this.filteredProjects = this.projects.filter(p => p.status === status);
    }
  }

  getImageUrl(url?: string | null): string {
    if (!url) {
      return this.placeholderImage;
    }
    return url;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }

  getStatusLabel(status: string): string {
    if (status === 'completed') {
      return this.t('status.completed');
    }
    if (status === 'in_progress') {
      return this.t('status.in_progress');
    }
    return this.t('status.archived');
  }
}
