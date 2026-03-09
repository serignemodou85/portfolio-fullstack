// src/app/features/contact/contact-form/contact-form.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface ContactCreateResponse {
  id?: number;
  email_warning?: string;
  email_warning_codes?: string[];
}

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss'
})
export class ContactForm {
  formData: ContactData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  loading = false;
  success = false;
  error: string | null = null;
  warning: string | null = null;

  constructor(private http: HttpClient) {}

  onSubmit(form: NgForm): void {
    // Empêche l'envoi si le formulaire est invalide et marque tous les champs comme \"touchés\"
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.loading = true;
    this.success = false;
    this.error = null;
    this.warning = null;

    this.http.post<ContactCreateResponse>(`${environment.apiUrl}/contact/`, this.formData).subscribe({
      next: (response) => {
        this.success = true;
        if (response?.email_warning) {
          this.warning = response.email_warning;
        }
        this.loading = false;
        this.resetForm();
        form.resetForm();
      },
      error: (err) => {
        this.error = 'Une erreur est survenue lors de l’envoi. Merci de réessayer ou de me contacter directement par email.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
  }
}
