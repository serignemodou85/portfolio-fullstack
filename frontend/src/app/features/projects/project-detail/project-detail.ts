// src/app/features/projects/project-detail/project-detail.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../services/project';
import { ProjectDetail as ProjectDetailModel } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit {
  project: ProjectDetailModel | null = null;
  loading = true;
  error: string | null = null;
  readonly placeholderImage = 'assets/placeholders/project.svg';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadProject(slug);
    }
  }

  loadProject(slug: string): void {
    this.projectService.getProjectBySlug(slug).subscribe({
      next: (project) => {
        if (project.status === 'archived') {
          this.error = 'Projet introuvable';
          this.loading = false;
          return;
        }
        this.project = project;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Projet introuvable';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getStatusLabel(status: string): string {
    if (status === 'completed') {
      return 'Termine';
    }
    if (status === 'in_progress') {
      return 'En cours';
    }
    return 'Archive';
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
}
