// src/app/features/admin/profile-admin/profile-admin.ts
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../../core/models/auth.model';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { MfaSettings } from './mfa-settings/mfa-settings';

const PROFILE_FIELDS = [
  'first_name', 'last_name', 'email', 'bio', 'location', 'phone',
  'github_url', 'linkedin_url', 'twitter_url', 'website_url'
] as const;

type ProfileForm = Record<(typeof PROFILE_FIELDS)[number], string>;

@Component({
  selector: 'app-profile-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, AdminShell, MfaSettings],
  templateUrl: './profile-admin.html',
  styleUrl: './profile-admin.scss'
})
export class ProfileAdmin implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  lang = inject(LanguageService);

  readonly currentUser = signal<User | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly cvName = signal<string | null>(null);
  readonly currentCvUrl = signal<string | null>(null);

  /** Modèle du formulaire (template-driven, lié par ngModel). */
  formData = this.toForm(null);
  private profileImage: File | null = null;
  private cvFile: File | null = null;
  private objectUrl: string | null = null;

  constructor() {
    // Libère l'aperçu local de la photo en quittant la page.
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.userService.getMe().subscribe({
      next: (user) => {
        this.applyUser(user);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le profil.');
        this.loading.set(false);
      }
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.profileImage = file;
    this.revokePreview();
    this.objectUrl = URL.createObjectURL(file);
    this.previewUrl.set(this.objectUrl);
  }

  onCvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.cvFile = file;
    this.cvName.set(file.name);
  }

  submit(): void {
    this.saving.set(true);
    this.error.set(null);

    const payload = new FormData();
    Object.entries(this.formData).forEach(([key, value]) => payload.append(key, value ?? ''));
    if (this.profileImage) {
      payload.append('profile_picture', this.profileImage);
    }
    if (this.cvFile) {
      payload.append('cv_file', this.cvFile);
    }

    this.userService.updateMe(payload).subscribe({
      next: (user) => {
        this.applyUser(user);
        this.profileImage = null;
        this.cvFile = null;
        this.cvName.set(null);
        this.saving.set(false);
        this.toast.success('Profil mis à jour.');
        this.authService.fetchCurrentUser().subscribe();
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Erreur lors de la mise à jour du profil.'));
        this.saving.set(false);
      }
    });
  }

  private applyUser(user: User): void {
    this.currentUser.set(user);
    this.formData = this.toForm(user);
    if (user.profile_picture) {
      this.revokePreview();
      this.previewUrl.set(user.profile_picture);
    }
    this.currentCvUrl.set(user.cv_file || null);
  }

  private toForm(user: User | null): ProfileForm {
    const form = {} as ProfileForm;
    for (const field of PROFILE_FIELDS) {
      form[field] = (user?.[field] as string | undefined) || '';
    }
    return form;
  }

  private revokePreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
