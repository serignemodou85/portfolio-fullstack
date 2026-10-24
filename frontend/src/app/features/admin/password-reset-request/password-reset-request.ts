import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-password-reset-request',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './password-reset-request.html',
  styleUrl: './password-reset-request.scss'
})
export class PasswordResetRequest {
  private authService = inject(AuthService);

  readonly email = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.loading() || !this.email()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.authService.requestPasswordReset({ email: this.email() }).subscribe({
      next: (res) => {
        this.successMessage.set(res?.detail || 'Si ce compte existe, un email a été envoyé.');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Impossible d\'envoyer la demande pour le moment.'));
        this.loading.set(false);
      }
    });
  }
}
