// src/app/features/admin/project-form/project-form.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../projects/services/project';
import { ProjectDetail } from '../../../core/models/project.model';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

const emptyProject = () => ({
  title: '',
  slug: '',
  description: '',
  full_description: '',
  context: '',
  problem: '',
  solution: '',
  impact: '',
  technologies: '',
  github_url: '',
  live_url: '',
  status: 'in_progress' as ProjectDetail['status'],
  start_date: '',
  end_date: '',
  is_featured: false,
  order: 0,
  views: 0
});

type ImageSlot = 'thumbnail' | 'image_1' | 'image_2' | 'image_3';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [FormsModule, AdminShell],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss'
})
export class ProjectForm implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  lang = inject(LanguageService);

  readonly projectSlug = this.route.snapshot.paramMap.get('slug');
  readonly isEditMode = signal(!!this.projectSlug);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly thumbnailPreview = signal<string | null>(null);

  /** Modèle du formulaire (template-driven, lié par ngModel). */
  formData = emptyProject();
  private files: Partial<Record<ImageSlot, File>> = {};

  ngOnInit(): void {
    if (this.projectSlug) {
      this.loadProject(this.projectSlug);
    }
  }

  loadProject(slug: string): void {
    this.loading.set(true);
    this.projectService.getProjectBySlug(slug).subscribe({
      next: (project) => {
        const form = emptyProject();
        for (const key of Object.keys(form) as (keyof typeof form)[]) {
          const value = project[key as keyof ProjectDetail];
          if (value !== null && value !== undefined) {
            (form as Record<string, unknown>)[key] = value;
          }
        }
        this.formData = form;
        this.thumbnailPreview.set(project.thumbnail ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Projet introuvable.');
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: Event, slot: ImageSlot = 'thumbnail'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.files[slot] = file;
    if (slot === 'thumbnail') {
      const reader = new FileReader();
      reader.onload = () => this.thumbnailPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  generateSlug(): void {
    this.formData.slug = this.formData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);

    const payload = new FormData();
    Object.entries(this.formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        payload.append(key, String(value));
      }
    });
    for (const [slot, file] of Object.entries(this.files)) {
      payload.append(slot, file);
    }

    const editing = this.isEditMode() && this.projectSlug;
    const request$ = editing
      ? this.projectService.partialUpdateProject(this.projectSlug!, payload)
      : this.projectService.createProject(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(this.lang.t(editing ? 'admin.project.success.updated' : 'admin.project.success.created'));
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, editing ? 'Erreur lors de la mise à jour.' : 'Erreur lors de la création.'));
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    if (!this.loading()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }
}
