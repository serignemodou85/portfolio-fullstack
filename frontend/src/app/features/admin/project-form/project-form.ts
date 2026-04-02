// src/app/features/admin/project-form/project-form.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../projects/services/project';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShell],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss'
})
export class ProjectForm implements OnInit {
  isEditMode = false;
  projectSlug: string | null = null;
  loading = false;
  error: string | null = null;
  success = false;

  formData = {
    title: '',
    slug: '',
    description: '',
    full_description: '',
    technologies: '',
    github_url: '',
    live_url: '',
    status: 'in_progress',
    start_date: '',
    end_date: '',
    is_featured: false,
    order: 0,
    views: 0
  };

  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  image1File: File | null = null;
  image2File: File | null = null;
  image3File: File | null = null;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.projectSlug = this.route.snapshot.paramMap.get('slug');
    if (this.projectSlug) {
      this.isEditMode = true;
      this.loadProject(this.projectSlug);
    }
  }

  loadProject(slug: string): void {
    this.loading = true;
    this.projectService.getProjectBySlug(slug).subscribe({
      next: (project) => {
        this.formData = {
          title: project.title,
          slug: project.slug,
          description: project.description,
          full_description: project.full_description || '',
          technologies: project.technologies,
          github_url: project.github_url || '',
          live_url: project.live_url || '',
          status: project.status,
          start_date: project.start_date || '',
          end_date: project.end_date || '',
          is_featured: project.is_featured ?? false,
          order: project.order ?? 0,
          views: project.views ?? 0
        };
        this.thumbnailPreview = project.thumbnail;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Projet introuvable';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.thumbnailFile = file;

      // Prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.thumbnailPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onAdditionalImageSelected(event: any, slot: 1 | 2 | 3): void {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    if (slot === 1) {
      this.image1File = file;
    } else if (slot === 2) {
      this.image2File = file;
    } else {
      this.image3File = file;
    }
  }

  generateSlug(): void {
    this.formData.slug = this.formData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  onSubmit(): void {
    this.loading = true;
    this.error = null;
    this.success = false;

    // Crée FormData pour envoyer les fichiers
    const formData = new FormData();
    Object.keys(this.formData).forEach(key => {
      const value = (this.formData as any)[key];
      if (value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    if (this.thumbnailFile) {
      formData.append('thumbnail', this.thumbnailFile);
    }
    if (this.image1File) {
      formData.append('image_1', this.image1File);
    }
    if (this.image2File) {
      formData.append('image_2', this.image2File);
    }
    if (this.image3File) {
      formData.append('image_3', this.image3File);
    }

    if (this.isEditMode && this.projectSlug) {
      // Mode édition
      this.projectService.partialUpdateProject(this.projectSlug, formData).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/admin/dashboard']);
          }, 1500);
        },
        error: (err) => {
          const backendError = typeof err?.error === 'string'
            ? err.error
            : JSON.stringify(err?.error || {});
          this.error = `Erreur lors de la mise a jour: ${backendError}`;
          this.loading = false;
          console.error(err);
        }
      });
    } else {
      // Mode création
      this.projectService.createProject(formData).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/admin/dashboard']);
          }, 1500);
        },
        error: (err) => {
          this.error = 'Erreur lors de la création';
          this.loading = false;
          console.error(err);
        }
      });
    }
  }

  onCancel(): void {
    if (this.loading) {
      return;
    }
    this.router.navigate(['/admin/dashboard']);
  }
}

