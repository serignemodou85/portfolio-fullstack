// src/app/features/blog/article-list/article-list.ts
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArticleService } from '../services/article';
import { ArticleList as ArticleListModel } from '../../../core/models/article.model';
import { LanguageService } from '../../../core/services/language.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, RevealDirective],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss'
})
export class ArticleList implements OnInit {
  private articleService = inject(ArticleService);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly articles = signal<ArticleListModel[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  t(key: string): string {
    return this.lang.t(key);
  }

  ngOnInit(): void {
    this.articleService.getArticles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (articles) => {
        // Côté public, seuls les articles publiés sont listés.
        this.articles.set(articles.filter(a => a.status === 'published'));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
