// src/app/features/admin/experience-admin/experience-admin.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExperienceService } from '../../../core/services/experience.service';
import { ExperienceItem } from '../../../core/models/experience.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { LanguageService } from '../../../core/services/language.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { byDate, byText, tableState } from '../../../core/utils/table-state';

type SortKey = 'start_date_desc' | 'start_date_asc' | 'title_asc' | 'title_desc' | 'order_asc';

const emptyForm = () => ({
  type: 'work' as ExperienceItem['type'],
  title: '',
  company: '',
  location: '',
  description: '',
  start_date: '',
  end_date: '',
  is_current: false,
  order: 0
});

@Component({
  selector: 'app-experience-admin',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, AdminShell, PagerComponent],
  templateUrl: './experience-admin.html',
  styleUrl: './experience-admin.scss'
})
export class ExperienceAdmin implements OnInit {
  private experienceService = inject(ExperienceService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  lang = inject(LanguageService);

  readonly experiences = signal<ExperienceItem[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  /** Modèle du formulaire (template-driven, lié par ngModel). */
  formData = emptyForm();
  companyLogo: File | null = null;
  certificateFile: File | null = null;

  readonly table = tableState<ExperienceItem, SortKey>(this.experiences, {
    sort: 'start_date_desc',
    searchIn: e => [e.title, e.company, e.location, e.description],
    compare: sort => ({
      start_date_desc: byDate<ExperienceItem>(e => e.start_date, -1),
      start_date_asc: byDate<ExperienceItem>(e => e.start_date, 1),
      title_asc: byText<ExperienceItem>(e => e.title, 1),
      title_desc: byText<ExperienceItem>(e => e.title, -1),
      order_asc: (a: ExperienceItem, b: ExperienceItem) => (a.order ?? 0) - (b.order ?? 0),
    })[sort],
  });

  ngOnInit(): void {
    this.loadExperiences();
  }

  loadExperiences(): void {
    // Une session expirée est gérée par l'intercepteur d'auth (redirection vers le login).
    this.experienceService.getExperiences({ page_size: 1000 }).subscribe({
      next: (items) => this.experiences.set(items),
      error: (err) => this.error.set(apiErrorMessage(err, 'Impossible de charger les expériences.'))
    });
  }

  startEdit(item: ExperienceItem): void {
    this.editingId.set(item.id);
    this.companyLogo = null;
    this.certificateFile = null;
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
    this.editingId.set(null);
    this.formData = emptyForm();
    this.companyLogo = null;
    this.certificateFile = null;
  }

  onFileSelected(event: Event): void {
    this.companyLogo = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  onCertificateSelected(event: Event): void {
    this.certificateFile = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  onTypeChange(): void {
    if (this.formData.type === 'certification') {
      this.companyLogo = null;
    } else {
      this.certificateFile = null;
    }
  }

  submit(): void {
    const f = this.formData;
    if (!f.title || !f.company || !f.start_date || !f.description.trim()) {
      this.error.set('Titre, entreprise, date de début et description sont obligatoires.');
      return;
    }
    if (f.is_current) {
      f.end_date = '';
    }

    this.saving.set(true);
    this.error.set(null);
    const payload = new FormData();
    Object.entries(f).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        payload.append(key, String(value));
      }
    });
    if (this.companyLogo) {
      payload.append('company_logo', this.companyLogo);
    }
    if (this.certificateFile) {
      payload.append('certificate_file', this.certificateFile);
    }

    const id = this.editingId();
    const request$ = id
      ? this.experienceService.updateExperience(id, payload)
      : this.experienceService.createExperience(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(id ? 'Expérience mise à jour.' : 'Expérience ajoutée.');
        this.loadExperiences();
        this.resetForm();
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Erreur lors de la sauvegarde.'));
        this.saving.set(false);
      }
    });
  }

  deleteExperience(exp: ExperienceItem): void {
    this.confirmService.confirm({
      title: 'Supprimer l\'expérience',
      message: `Supprimer "${exp.title}" ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.experienceService.deleteExperience(exp.id).subscribe({
        next: () => {
          this.toastService.success('Expérience supprimée.');
          this.experiences.update(list => list.filter(e => e.id !== exp.id));
        },
        error: (err) => this.toastService.error(apiErrorMessage(err, 'Erreur lors de la suppression.'))
      });
    });
  }
}
