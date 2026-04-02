// src/app/features/admin/profile-admin/profile-admin.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../../core/models/auth.model';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-profile-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminShell],
  templateUrl: './profile-admin.html',
  styleUrl: './profile-admin.scss'
})
export class ProfileAdmin implements OnInit {
  currentUser: User | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  formData: {
    first_name: string;
    last_name: string;
    email: string;
    bio: string;
    location: string;
    phone: string;
    github_url: string;
    linkedin_url: string;
    twitter_url: string;
    website_url: string;
  } = {
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    github_url: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: ''
  };

  profileImage: File | null = null;
  previewUrl: string | null = null;

  constructor(private userService: UserService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.success = null;
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.formData = {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          bio: user.bio || '',
          location: user.location || '',
          phone: user.phone || '',
          github_url: user.github_url || '',
          linkedin_url: user.linkedin_url || '',
          twitter_url: user.twitter_url || '',
          website_url: user.website_url || ''
        };
        this.previewUrl = user.profile_picture || null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le profil.';
        this.loading = false;
      }
    });
  }

  onImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    this.profileImage = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  submit(): void {
    this.saving = true;
    this.error = null;
    this.success = null;

    const payload = new FormData();
    Object.entries(this.formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        payload.append(key, value as string);
      }
    });

    if (this.profileImage) {
      payload.append('profile_picture', this.profileImage);
    }

    this.userService.updateMe(payload).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.previewUrl = user.profile_picture || this.previewUrl;
        this.success = 'Profil mis a jour.';
        this.saving = false;
        this.authService.fetchCurrentUser().subscribe();
      },
      error: (err) => {
        this.error = this.getErrorMessage(err, 'Erreur lors de la mise a jour du profil.');
        this.saving = false;
      }
    });
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (!err?.error) {
      return fallback;
    }
    if (typeof err.error.detail === 'string') {
      return err.error.detail;
    }
    if (Array.isArray(err.error.non_field_errors) && err.error.non_field_errors.length) {
      return err.error.non_field_errors[0];
    }
    for (const value of Object.values(err.error)) {
      if (Array.isArray(value) && value.length && typeof value[0] === 'string') {
        return value[0];
      }
    }
    return fallback;
  }
}
