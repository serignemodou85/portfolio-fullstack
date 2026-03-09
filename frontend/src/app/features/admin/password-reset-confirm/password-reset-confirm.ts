import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-password-reset-confirm',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './password-reset-confirm.html',
  styleUrl: './password-reset-confirm.scss'
})
export class PasswordResetConfirm implements OnInit {
  uid = '';
  token = '';
  newPassword = '';
  newPassword2 = '';
  loading = false;
  success = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.uid = this.route.snapshot.queryParamMap.get('uid') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.uid || !this.token) {
      this.error = 'Lien invalide. Veuillez refaire une demande.';
    }
  }

  onSubmit(): void {
    if (this.loading || !this.uid || !this.token) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.confirmPasswordReset({
      uid: this.uid,
      token: this.token,
      new_password: this.newPassword,
      new_password2: this.newPassword2
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractError(err);
        this.loading = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/admin/login']);
  }

  private extractError(err: any): string {
    if (typeof err?.error?.detail === 'string') {
      return err.error.detail;
    }
    if (typeof err?.error?.non_field_errors?.[0] === 'string') {
      return err.error.non_field_errors[0];
    }
    if (typeof err?.error?.new_password?.[0] === 'string') {
      return err.error.new_password[0];
    }
    if (typeof err?.error?.new_password2?.[0] === 'string') {
      return err.error.new_password2[0];
    }
    return 'Reinitialisation impossible. Veuillez redemander un nouveau lien.';
  }
}
