// src/app/features/admin/login/login.ts
import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { LoginRequest, isMfaChallenge } from '../../../core/models/auth.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  lang = inject(LanguageService);

  /** Modèle du formulaire (template-driven, lié par ngModel). */
  credentials: LoginRequest = { username: '', password: '' };
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  // Étape 2 : renseigné quand le mot de passe est bon mais que la 2FA est active.
  readonly mfaToken = signal<string | null>(null);
  readonly mfaCode = signal('');
  private readonly mfaInput = viewChild<ElementRef<HTMLInputElement>>('mfaInput');

  private readonly returnUrl: string;

  constructor() {
    const raw = this.route.snapshot.queryParams['returnUrl'] || '';
    this.returnUrl = this.isSafeReturnUrl(raw) ? raw : '/admin/dashboard';
    // Focus sur le champ du code dès que l'étape 2FA s'affiche.
    effect(() => this.mfaInput()?.nativeElement.focus());
  }

  onSubmit(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (isMfaChallenge(res)) {
          this.mfaToken.set(res.mfa_token);
          this.credentials.password = '';
          return;
        }
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Identifiants incorrects.'));
        this.loading.set(false);
      }
    });
  }

  onVerifyMfa(): void {
    const token = this.mfaToken();
    if (this.loading() || !token) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.authService.verifyMfa(token, this.mfaCode()).subscribe({
      next: () => this.router.navigate([this.returnUrl]),
      error: (err) => {
        this.loading.set(false);
        this.mfaCode.set('');
        // Jeton intermédiaire expiré (> 5 min) : on repart de l'étape mot de passe.
        if (err?.error?.code === 'mfa_token_expired') {
          this.cancelMfa();
        }
        this.error.set(apiErrorMessage(err, this.lang.t('mfa.login.invalid')));
      }
    });
  }

  cancelMfa(): void {
    this.mfaToken.set(null);
    this.mfaCode.set('');
    this.error.set(null);
  }

  private isSafeReturnUrl(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');
  }
}
