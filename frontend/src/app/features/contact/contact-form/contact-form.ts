// src/app/features/contact/contact-form/contact-form.ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  mission_type?: string;
  message: string;
  /** Honeypot : invisible pour un humain, rempli par les robots (filtré côté serveur). */
  website?: string;
}

interface ContactCreateResponse {
  id?: number;
  email_warning?: string;
  email_warning_codes?: string[];
}

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss'
})
export class ContactForm {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  formData: ContactData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    mission_type: '',
    message: '',
    website: ''
  };

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal(false);
  readonly warning = signal<string | null>(null);

  t(key: string): string {
    return this.lang.t(key);
  }

  onSubmit(form: NgForm): void {
    // Empêche l'envoi si le formulaire est invalide et marque tous les champs comme « touchés »
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.loading.set(true);
    this.success.set(false);
    this.error.set(false);
    this.warning.set(null);

    this.http.post<ContactCreateResponse>(`${environment.apiUrl}/contact/`, this.formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.success.set(true);
        this.warning.set(response?.email_warning || null);
        this.loading.set(false);
        this.resetForm();
        form.resetForm();
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      mission_type: '',
      message: '',
      website: ''
    };
  }
}
