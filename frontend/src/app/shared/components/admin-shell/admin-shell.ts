// src/app/shared/components/admin-shell/admin-shell.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss'
})
export class AdminShell {
  constructor(
    private authService: AuthService,
    private router: Router,
    public theme: ThemeService,
    public langService: LanguageService
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
