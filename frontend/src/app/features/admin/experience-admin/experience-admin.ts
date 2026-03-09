// src/app/features/admin/experience-admin/experience-admin.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExperienceService } from '../../../core/services/experience.service';
import { ExperienceItem } from '../../../core/models/experience.model';

@Component({
  selector: 'app-experience-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './experience-admin.html',
  styleUrl: './experience-admin.scss'
})
export class ExperienceAdmin implements OnInit {
  experiences: ExperienceItem[] = [];
  editingId: number | null = null;
  loading = false;
  error: string | null = null;

  formData = {
    type: 'work',
    title: '',
    company: '',
    location: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
    order: 0
  };

  companyLogo: File | null = null;

  constructor(private experienceService: ExperienceService) {}

  ngOnInit(): void {
    this.loadExperiences();
  }

  loadExperiences(): void {
    this.experienceService.getExperiences().subscribe({
      next: (items) => (this.experiences = items),
      error: () => (this.error = 'Impossible de charger les experiences.')
    });
  }

  startEdit(item: ExperienceItem): void {
    this.editingId = item.id;
    this.formData = {
      type: item.type,
      title: item.title,
      company: item.company,
      location: item.location || '',
      description: item.description,
      start_date: item.start_date,
      end_date: item.end_date || '',
      is_current: item.is_current,
      order: item.order
    };
  }

  resetForm(): void {
    this.editingId = null;
    this.formData = {
      type: 'work',
      title: '',
      company: '',
      location: '',
      description: '',
      start_date: '',
      end_date: '',
      is_current: false,
      order: 0
    };
    this.companyLogo = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.companyLogo = file;
    }
  }

  submit(): void {
    this.loading = true;
    this.error = null;
    const payload = new FormData();
    Object.entries(this.formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        payload.append(key, value as any);
      }
    });
    if (this.companyLogo) {
      payload.append('company_logo', this.companyLogo);
    }

    const request$ = this.editingId
      ? this.experienceService.updateExperience(this.editingId, payload)
      : this.experienceService.createExperience(payload);

    request$.subscribe({
      next: () => {
        this.loadExperiences();
        this.resetForm();
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors de la sauvegarde.';
        this.loading = false;
      }
    });
  }

  deleteExperience(id: number): void {
    const confirmed = window.confirm('Supprimer cette experience ?');
    if (!confirmed) {
      return;
    }
    this.experienceService.deleteExperience(id).subscribe({
      next: () => this.loadExperiences(),
      error: () => (this.error = 'Erreur lors de la suppression.')
    });
  }
}
