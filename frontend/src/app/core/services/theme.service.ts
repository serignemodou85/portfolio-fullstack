import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'theme';
  private readonly _dark = signal(ThemeService.initial());

  /** Thème sombre actif (signal). */
  readonly isDark = this._dark.asReadonly();

  constructor() {
    this.apply();
  }

  toggle(): void {
    this._dark.update(dark => !dark);
    try { localStorage.setItem(this.KEY, this._dark() ? 'dark' : 'light'); } catch { /* stockage indisponible */ }
    this.apply();
  }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', this._dark() ? 'dark' : 'light');
  }

  private static initial(): boolean {
    let saved: string | null = null;
    try { saved = localStorage.getItem('theme'); } catch { /* stockage indisponible */ }
    return saved === 'dark' || (!saved && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  }
}
