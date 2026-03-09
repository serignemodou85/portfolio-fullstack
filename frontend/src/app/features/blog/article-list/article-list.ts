// src/app/features/blog/article-list/article-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArticleService } from '../services/article';
import { ArticleList as ArticleListModel } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss'
})
export class ArticleList implements OnInit {
  articles: ArticleListModel[] = [];
  loading = true;
  error: string | null = null;

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.articleService.getArticles().subscribe({
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
      return 'Publie';
    }
    if (status === 'archived') {
      return 'Archive';
    }
    return 'Brouillon';
  }
}
