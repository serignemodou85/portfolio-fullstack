import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageService } from './language.service';

const SITE_NAME = 'Modou Fall';
const DEFAULT_IMAGE = '/og-image.png';

export interface PageSeo {
  title: string;
  description: string;
  image?: string | null;
  type?: 'website' | 'article';
}

/**
 * Titre d'onglet, meta description, Open Graph / Twitter et URL canonique par page.
 * Chaque route publique déclare `data: { seo: '<clé>' }` (textes dans language.service) ;
 * les pages de détail appellent setPage() une fois leur contenu chargé.
 * L'admin n'est jamais indexé.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lang = inject(LanguageService);
  private document = inject(DOCUMENT);

  // Contenu fourni par une page de détail : prioritaire sur le texte générique de la route.
  private pageOverride: PageSeo | null = null;

  init(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.pageOverride = null;
      this.apply();
    });
    this.lang.lang$.subscribe(() => this.apply());
  }

  setPage(page: PageSeo): void {
    this.pageOverride = page;
    this.apply();
  }

  private apply(): void {
    const url = this.router.url.split(/[?#]/)[0];
    const isAdmin = url.startsWith('/admin');
    this.document.documentElement.lang = this.lang.current;

    if (isAdmin) {
      this.title.setTitle(`Admin — ${SITE_NAME}`);
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      return;
    }
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    const page = this.pageOverride ?? this.fromRoute();
    const fullTitle = page.title.includes(SITE_NAME) ? page.title : `${page.title} — ${SITE_NAME}`;
    const origin = this.document.location?.origin ?? '';
    const canonical = origin + (url === '/' ? '/' : url);
    const image = this.absolute(page.image || DEFAULT_IMAGE, origin);

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:type', content: page.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: this.lang.current === 'fr' ? 'fr_FR' : 'en_US' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.setCanonical(canonical);
  }

  private fromRoute(): PageSeo {
    let route = this.route.snapshot;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const key = (route.data?.['seo'] as string | undefined) ?? 'home';
    return {
      title: this.lang.t(`seo.${key}.title`),
      description: this.lang.t(`seo.${key}.desc`),
    };
  }

  private absolute(src: string, origin: string): string {
    return /^https?:\/\//.test(src) ? src : origin + (src.startsWith('/') ? src : `/${src}`);
  }

  private setCanonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = href;
  }
}
