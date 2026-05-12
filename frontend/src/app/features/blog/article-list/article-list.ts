// src/app/features/blog/article-list/article-list.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ArticleService } from '../services/article';
import { ArticleList as ArticleListModel } from '../../../core/models/article.model';
import { LanguageService, Lang } from '../../../core/services/language.service';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss'
})
export class ArticleList implements OnInit, OnDestroy {
  articles: ArticleListModel[] = [];
  loading = true;
  error: string | null = null;
  lang: Lang = 'fr';
  private destroy$ = new Subject<void>();

  constructor(
    private articleService: ArticleService,
    private langService: LanguageService
  ) {
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe(l => this.lang = l);
  }

  t(key: string): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.loadArticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadArticles(): void {
    this.articleService.getArticles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (articles) => {
        this.articles = articles;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des articles';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getStatusLabel(status: string): string {
    if (status === 'published') {
      return this.t('blog.status.published');
    }
    if (status === 'archived') {
      return this.t('blog.status.archived');
    }
    return this.t('blog.status.draft');
  }
}
