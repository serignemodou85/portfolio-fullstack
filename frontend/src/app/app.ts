// src/app/app.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  title = 'Portfolio';
  showNavbar = true;
  private navSub?: Subscription;

  constructor(private router: Router, seo: SeoService) {
    seo.init();
  }

  ngOnInit(): void {
    this.showNavbar = !this.router.url.startsWith('/admin');
    this.navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.showNavbar = !nav.urlAfterRedirects.startsWith('/admin');
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }
}
