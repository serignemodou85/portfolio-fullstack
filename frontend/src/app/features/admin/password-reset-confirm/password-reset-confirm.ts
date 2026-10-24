import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-password-reset-confirm',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './password-reset-confirm.html',
  styleUrl: './password-reset-confirm.scss'
})
export class PasswordResetConfirm {
  private authService = inject(AuthService);
  private params = inject(ActivatedRoute).snapshot.queryParamMap;

  private readonly uid = this.params.get('uid') || '';
  private readonly token = this.params.get('token') || '';

  readonly newPassword = signal('');
  readonly newPassword2 = signal('');
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(
    this.uid && this.token ? null : 'Lien invalide. Veuillez refaire une demande.'
  );

  onSubmit(): void {
    if (this.loading() || !this.uid || !this.token) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.authService.confirmPasswordReset({
      uid: this.uid,
      token: this.token,
      new_password: this.newPassword(),
      new_password2: this.newPassword2()
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Réinitialisation impossible. Veuillez redemander un nouveau lien.'));
        this.loading.set(false);
      }
    });
  }
}
