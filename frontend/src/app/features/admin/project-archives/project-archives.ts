import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../projects/services/project';
import { ProjectList } from '../../../core/models/project.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { LanguageService } from '../../../core/services/language.service';
import { byDate, byText, tableState } from '../../../core/utils/table-state';

type SortKey = 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc';

@Component({
  selector: 'app-project-archives',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, AdminShell, PagerComponent],
  templateUrl: './project-archives.html',
  styleUrl: './project-archives.scss'
})
export class ProjectArchives implements OnInit {
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  lang = inject(LanguageService);

  readonly placeholderImage = 'assets/placeholders/project.svg';
  readonly archivedProjects = signal<ProjectList[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly table = tableState<ProjectList, SortKey>(this.archivedProjects, {
    sort: 'updated_desc',
    searchIn: p => [p.title, p.description, p.technologies],
    compare: sort => ({
      updated_desc: byDate<ProjectList>(p => p.updated_at, -1),
      updated_asc: byDate<ProjectList>(p => p.updated_at, 1),
      title_asc: byText<ProjectList>(p => p.title, 1),
      title_desc: byText<ProjectList>(p => p.title, -1),
    })[sort],
  });

  ngOnInit(): void {
    this.loadArchivedProjects();
  }

  loadArchivedProjects(): void {
    this.loading.set(true);
    this.error.set(false);
    this.projectService.getProjects({ status: 'archived', page_size: 1000 }).subscribe({
      next: (projects) => {
        this.archivedProjects.set(projects);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  restoreProject(project: ProjectList): void {
    this.confirmService.confirm({
      title: 'Restaurer le projet',
      message: `Restaurer "${project.title}" dans les projets actifs ?`,
      confirmLabel: 'Restaurer',
      danger: false
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.projectService.restoreProject(project.slug).subscribe({
        next: () => {
          this.removeLocally(project);
          this.toastService.success('Projet restauré.');
        },
        error: () => this.toastService.error('La restauration a échoué.')
      });
    });
  }

  deletePermanently(project: ProjectList): void {
    this.confirmService.confirm({
      title: 'Suppression définitive',
      message: `Supprimer définitivement "${project.title}" ? Il sera effacé de la base de données, sans possibilité de récupération.`,
      confirmLabel: 'Supprimer définitivement'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.projectService.deleteProject(project.slug).subscribe({
        next: () => {
          this.removeLocally(project);
          this.toastService.success('Projet supprimé définitivement.');
        },
        error: () => this.toastService.error('La suppression définitive a échoué.')
      });
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.endsWith(this.placeholderImage)) {
      img.src = this.placeholderImage;
    }
  }

  private removeLocally(project: ProjectList): void {
    this.archivedProjects.update(list => list.filter(item => item.slug !== project.slug));
  }
}
