// src/app/features/blog/article-detail/article-detail.ts
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleService } from '../services/article';
import { ArticleDetail as ArticleDetailModel } from '../../../core/models/article.model';
import { LanguageService } from '../../../core/services/language.service';
import { SeoService } from '../../../core/services/seo.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss'
})
export class ArticleDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private articleService = inject(ArticleService);
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly article = signal<ArticleDetailModel | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.load(slug);
      }
    });
  }

  t(key: string): string {
    return this.lang.t(key);
  }

  shareUrl(): string {
    return encodeURIComponent(window.location.href);
  }

  copyLink(): void {
    navigator.clipboard?.writeText(window.location.href).then(
      () => this.toast.success(this.t('blog.copied')),
      () => undefined
    );
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.articleService.getArticleBySlug(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (article) => {
        this.article.set(article);
        this.seo.setPage({ title: article.title, description: article.excerpt, image: article.featured_image, type: 'article' });
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }
}
