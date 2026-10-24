// src/app/app.ts
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SeoService } from './core/services/seo.service';

const isAdminUrl = (url: string) => url.startsWith('/admin');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);

  /** Navbar et footer publics : masqués dans l'espace admin, qui a sa propre navigation. */
  readonly isPublic = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => !isAdminUrl(event.urlAfterRedirects))
    ),
    { initialValue: !isAdminUrl(this.router.url) }
  );

  constructor() {
    inject(SeoService).init();
  }
}
