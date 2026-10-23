// src/app/features/admin/login/login.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { LoginRequest, isMfaChallenge } from '../../../core/models/auth.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  credentials: LoginRequest = {
    username: '',
    password: ''
  };
  error: string | null = null;
  loading = false;
  showPassword = false;
  returnUrl: string = '/admin/dashboard';

  // Étape 2 : renseigné quand le mot de passe est bon mais que la 2FA est active.
  mfaToken: string | null = null;
  mfaCode = '';

  @ViewChild('mfaInput') set mfaInput(el: ElementRef<HTMLInputElement> | undefined) {
    el?.nativeElement.focus();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public lang: LanguageService
  ) {
    const raw = this.route.snapshot.queryParams['returnUrl'] || '';
    this.returnUrl = this.isSafeReturnUrl(raw) ? raw : '/admin/dashboard';
  }

  private isSafeReturnUrl(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');
  }

  onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.error = null;

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.loading = false;
        if (isMfaChallenge(res)) {
          this.mfaToken = res.mfa_token;
          this.credentials.password = '';
          return;
        }
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Identifiants incorrects';
        this.loading = false;
      }
    });
  }

  onVerifyMfa(): void {
    if (this.loading || !this.mfaToken) {
      return;
    }
    this.loading = true;
    this.error = null;

    this.authService.verifyMfa(this.mfaToken, this.mfaCode).subscribe({
      next: () => this.router.navigate([this.returnUrl]),
      error: (err) => {
        this.loading = false;
        this.mfaCode = '';
        // Jeton intermédiaire expiré (> 5 min) : on repart de l'étape mot de passe.
        if (err?.error?.code === 'mfa_token_expired') {
          this.cancelMfa();
        }
        this.error = err?.error?.detail || this.lang.t('mfa.login.invalid');
      }
    });
  }

  cancelMfa(): void {
    this.mfaToken = null;
    this.mfaCode = '';
    this.error = null;
  }
}
