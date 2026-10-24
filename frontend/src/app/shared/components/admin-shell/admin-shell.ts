// src/app/shared/components/admin-shell/admin-shell.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, ConfirmModalComponent],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss'
})
export class AdminShell {
  private authService = inject(AuthService);
  private router = inject(Router);
  theme = inject(ThemeService);
  langService = inject(LanguageService);


  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
