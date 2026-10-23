// src/app/features/blog/article-detail/article-detail.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleService } from '../services/article';
import { ArticleDetail as ArticleDetailModel } from '../../../core/models/article.model';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss'
})
export class ArticleDetail implements OnInit {
  article: ArticleDetailModel | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadArticle(slug);
    }
  }

  loadArticle(slug: string): void {
    this.articleService.getArticleBySlug(slug).subscribe({
      next: (article) => {
        this.article = article;
        this.seo.setPage({ title: article.title, description: article.excerpt, image: article.featured_image, type: 'article' });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Article introuvable';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getCurrentUrl(): string {
    return encodeURIComponent(window.location.href);
  }
}
