// src/app/features/admin/login/login.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
  returnUrl: string = '/admin/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
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
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Identifiants incorrects';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
