// src/app/shared/navbar/navbar.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService, Lang } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnDestroy {
  mobileMenuOpen = false;
  lang: Lang = 'fr';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    public theme: ThemeService,
    public langService: LanguageService
  ) {
    langService.lang$.pipe(takeUntil(this.destroy$)).subscribe(l => this.lang = l);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  t(key: string): string {
    return this.langService.t(key);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
