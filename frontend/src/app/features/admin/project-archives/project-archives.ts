import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../projects/services/project';
import { ProjectList } from '../../../core/models/project.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-project-archives',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './project-archives.html',
  styleUrl: './project-archives.scss'
})
export class ProjectArchives implements OnInit {
  archivedProjects: ProjectList[] = [];
  loading = true;
  error: string | null = null;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadArchivedProjects();
  }

  loadArchivedProjects(): void {
    this.loading = true;
    this.error = null;

    this.projectService.getProjects({ status: 'archived' }).subscribe({
      next: (projects) => {
        this.archivedProjects = projects;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement archives:', err);
        this.error = 'Impossible de charger les projets archives.';
        this.loading = false;
      }
    });
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
      },
      error: (err) => {
        console.error('Erreur suppression definitive projet:', err);
        window.alert('La suppression definitive a echoue.');
      }
    });
  }
}
