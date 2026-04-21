import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-password-reset-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './password-reset-request.html',
  styleUrl: './password-reset-request.scss'
})
export class PasswordResetRequest {
  email = '';
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (this.loading || !this.email) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.authService.requestPasswordReset({ email: this.email }).subscribe({
      next: (res) => {
        this.successMessage = res?.detail || 'Si ce compte existe, un email a été envoyé.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || "Impossible d'envoyer la demande pour le moment.";
        this.loading = false;
      }
    });
  }
}
