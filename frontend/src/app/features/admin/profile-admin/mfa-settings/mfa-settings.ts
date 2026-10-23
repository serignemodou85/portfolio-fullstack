import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { LanguageService } from '../../../../core/services/language.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MfaSetupResponse } from '../../../../core/models/auth.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type Step = 'idle' | 'setup' | 'backup' | 'disable';

@Component({
  selector: 'app-mfa-settings',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './mfa-settings.html',
  styleUrl: './mfa-settings.scss'
})
export class MfaSettings {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  lang = inject(LanguageService);

  readonly enabled = signal(false);
  readonly step = signal<Step>('idle');
  readonly setup = signal<MfaSetupResponse | null>(null);
  readonly backupCodes = signal<string[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  code = '';

  @Input() set isEnabled(value: boolean | undefined) {
    this.enabled.set(!!value);
  }

  startSetup(): void {
    this.run(this.auth.setupMfa(), (res) => {
      this.setup.set(res);
      this.step.set('setup');
    });
  }

  confirmSetup(): void {
    this.run(this.auth.enableMfa(this.code), (res) => {
      this.enabled.set(true);
      this.backupCodes.set(res.backup_codes);
      this.setup.set(null);
      this.step.set('backup');
      this.toast.success(this.lang.t('mfa.enabled_ok'));
    });
  }

  confirmDisable(): void {
    this.run(this.auth.disableMfa(this.code), () => {
      this.enabled.set(false);
      this.step.set('idle');
      this.toast.success(this.lang.t('mfa.disabled_ok'));
    });
  }

  copyBackupCodes(): void {
    navigator.clipboard?.writeText(this.backupCodes().join('\n'));
  }

  finish(): void {
    this.backupCodes.set([]);
    this.reset();
  }

  reset(): void {
    this.step.set('idle');
    this.setup.set(null);
    this.code = '';
    this.error.set(null);
  }

  begin(step: Step): void {
    this.code = '';
    this.error.set(null);
    this.step.set(step);
  }

  private run<T>(request: Observable<T>, onSuccess: (res: T) => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: (res) => {
        this.busy.set(false);
        this.code = '';
        onSuccess(res);
      },
      error: (err) => {
        this.busy.set(false);
        this.code = '';
        this.error.set(err?.error?.detail || this.lang.t('mfa.login.invalid'));
      }
    });
  }
}
