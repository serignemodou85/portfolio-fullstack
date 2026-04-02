// src/app/features/admin/blog-admin/blog-admin.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { ArticleList } from '../../../core/models/article.model';
import { BlogCategory, BlogTag } from '../../../core/models/blog.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, AdminShell],
  templateUrl: './blog-admin.html',
  styleUrl: './blog-admin.scss'
})
export class BlogAdmin implements OnInit {
  categories: BlogCategory[] = [];
  tags: BlogTag[] = [];
  articles: ArticleList[] = [];
  error: string | null = null;
  loading = false;
  pageSize = 5;
  pageSizeOptions = [4, 5, 10, 20];
  categoryPage = 1;
  tagPage = 1;
  articlePage = 1;
  categorySearch = '';
  tagSearch = '';
  articleSearch = '';
  categorySort: 'name_asc' | 'name_desc' = 'name_asc';
  tagSort: 'name_asc' | 'name_desc' = 'name_asc';
  articleSort: 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' = 'date_desc';

  editingCategorySlug: string | null = null;
  editingTagSlug: string | null = null;
  editingArticleSlug: string | null = null;
  featuredImage: File | null = null;

  categoryForm = { name: '', slug: '', description: '' };
  tagForm = { name: '', slug: '' };

  articleForm = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags_ids: [] as number[],
    status: 'draft',
    is_featured: false,
    reading_time: 5,
    published_at: ''
  };

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.blogService.getCategories({ page_size: 1000 }).subscribe({
      next: (items) => {
        this.categories = items;
        this.syncCategoryPage();
      },
      error: () => (this.error = 'Erreur chargement categories.')
    });
    this.blogService.getTags({ page_size: 1000 }).subscribe({
      next: (items) => {
        this.tags = items;
        this.syncTagPage();
      },
      error: () => (this.error = 'Erreur chargement tags.')
    });
    this.blogService.getArticles({ page_size: 1000 }).subscribe({
      next: (items) => {
        this.articles = items;
        this.syncArticlePage();
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement articles.';
        this.loading = false;
      }
    });
  }

  get pagedCategories(): BlogCategory[] {
    return this.paginate(this.processedCategories, this.categoryPage);
  }

  get pagedTags(): BlogTag[] {
    return this.paginate(this.processedTags, this.tagPage);
  }

  get pagedArticles(): ArticleList[] {
    return this.paginate(this.processedArticles, this.articlePage);
  }

  get categoryTotalPages(): number {
    return Math.max(1, Math.ceil(this.processedCategories.length / this.pageSize));
  }

  get tagTotalPages(): number {
    return Math.max(1, Math.ceil(this.processedTags.length / this.pageSize));
  }

  get articleTotalPages(): number {
    return Math.max(1, Math.ceil(this.processedArticles.length / this.pageSize));
  }

  setCategoryPage(page: number): void {
    this.categoryPage = this.clampPage(page, this.categoryTotalPages);
  }

  setTagPage(page: number): void {
    this.tagPage = this.clampPage(page, this.tagTotalPages);
  }

  setArticlePage(page: number): void {
    this.articlePage = this.clampPage(page, this.articleTotalPages);
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.syncCategoryPage();
    this.syncTagPage();
    this.syncArticlePage();
  }

  get processedCategories(): BlogCategory[] {
    const query = this.categorySearch.trim().toLowerCase();
    let items = this.categories;
    if (query) {
      items = items.filter((cat) =>
        [cat.name, cat.slug, cat.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(query))
      );
    }
    return this.sortCategories(items);
  }

  get processedTags(): BlogTag[] {
    const query = this.tagSearch.trim().toLowerCase();
    let items = this.tags;
    if (query) {
      items = items.filter((tag) =>
        [tag.name, tag.slug].filter(Boolean).some((v) => String(v).toLowerCase().includes(query))
      );
    }
    return this.sortTags(items);
  }

  get processedArticles(): ArticleList[] {
    const query = this.articleSearch.trim().toLowerCase();
    let items = this.articles;
    if (query) {
      items = items.filter((article) =>
        [article.title, article.excerpt, article.category_name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query))
      );
    }
    return this.sortArticles(items);
  }

  submitCategory(): void {
    const request$ = this.editingCategorySlug
      ? this.blogService.updateCategory(this.editingCategorySlug, this.categoryForm)
      : this.blogService.createCategory(this.categoryForm);

    request$.subscribe({
      next: () => {
        this.resetCategory();
        this.loadAll();
      },
      error: () => (this.error = 'Erreur sauvegarde categorie.')
    });
  }

  editCategory(cat: BlogCategory): void {
    this.editingCategorySlug = cat.slug;
    this.categoryForm = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description || ''
    };
  }

  deleteCategory(cat: BlogCategory): void {
    const confirmed = window.confirm('Supprimer cette categorie ?');
    if (!confirmed) {
      return;
    }
    this.blogService.deleteCategory(cat.slug).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Erreur suppression categorie.')
    });
  }

  resetCategory(): void {
    this.editingCategorySlug = null;
    this.categoryForm = { name: '', slug: '', description: '' };
  }

  submitTag(): void {
    const request$ = this.editingTagSlug
      ? this.blogService.updateTag(this.editingTagSlug, this.tagForm)
      : this.blogService.createTag(this.tagForm);

    request$.subscribe({
      next: () => {
        this.resetTag();
        this.loadAll();
      },
      error: () => (this.error = 'Erreur sauvegarde tag.')
    });
  }

  editTag(tag: BlogTag): void {
    this.editingTagSlug = tag.slug;
    this.tagForm = {
      name: tag.name,
      slug: tag.slug
    };
  }

  deleteTag(tag: BlogTag): void {
    const confirmed = window.confirm('Supprimer ce tag ?');
    if (!confirmed) {
      return;
    }
    this.blogService.deleteTag(tag.slug).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Erreur suppression tag.')
    });
  }

  resetTag(): void {
    this.editingTagSlug = null;
    this.tagForm = { name: '', slug: '' };
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.featuredImage = file;
    }
  }

  onTagSelectionChange(tagId: number, checked: boolean): void {
    if (checked) {
      if (!this.articleForm.tags_ids.includes(tagId)) {
        this.articleForm.tags_ids.push(tagId);
      }
      return;
    }
    this.articleForm.tags_ids = this.articleForm.tags_ids.filter((id) => id !== tagId);
  }

  submitArticle(): void {
    const payload = new FormData();
    Object.entries(this.articleForm).forEach(([key, value]) => {
      if (key === 'tags_ids') {
        (value as number[]).forEach((id) => payload.append('tags_ids', String(id)));
      } else if (value !== null && value !== '') {
        payload.append(key, value as any);
      }
    });
    if (this.featuredImage) {
      payload.append('featured_image', this.featuredImage);
    }

    const request$ = this.editingArticleSlug
      ? this.blogService.partialUpdateArticle(this.editingArticleSlug, payload)
      : this.blogService.createArticle(payload);

    request$.subscribe({
      next: () => {
        this.resetArticleForm();
        this.loadAll();
      },
      error: () => (this.error = 'Erreur sauvegarde article.')
    });
  }

  editArticle(article: ArticleList): void {
    this.editingArticleSlug = article.slug;
    this.blogService.getArticle(article.slug).subscribe({
      next: (detail: any) => {
        this.articleForm = {
          title: detail.title,
          slug: detail.slug,
          excerpt: detail.excerpt,
          content: detail.content || '',
          category: detail.category?.id ? String(detail.category.id) : '',
          tags_ids: detail.tags?.map((t: any) => t.id) || [],
          status: detail.status,
          is_featured: detail.is_featured,
          reading_time: detail.reading_time,
          published_at: this.toDateTimeLocalValue(detail.published_at)
        };
      },
      error: () => (this.error = 'Erreur chargement article.')
    });
  }

  deleteArticle(article: ArticleList): void {
    const confirmed = window.confirm('Supprimer cet article ?');
    if (!confirmed) {
      return;
    }
    this.blogService.deleteArticle(article.slug).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Erreur suppression article.')
    });
  }

  resetArticleForm(): void {
    this.editingArticleSlug = null;
    this.featuredImage = null;
    this.articleForm = {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      tags_ids: [],
      status: 'draft',
      is_featured: false,
      reading_time: 5,
      published_at: ''
    };
  }

  statusLabel(status: string): string {
    if (status === 'published') {
      return 'Publié';
    }
    if (status === 'archived') {
      return 'Archivé';
    }
    return 'Brouillon';
  }

  private toDateTimeLocalValue(value?: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60000));
    return localDate.toISOString().slice(0, 16);
  }

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private clampPage(page: number, total: number): number {
    return Math.min(Math.max(page, 1), total);
  }

  private syncCategoryPage(): void {
    this.categoryPage = this.clampPage(this.categoryPage, this.categoryTotalPages);
  }

  private syncTagPage(): void {
    this.tagPage = this.clampPage(this.tagPage, this.tagTotalPages);
  }

  private syncArticlePage(): void {
    this.articlePage = this.clampPage(this.articlePage, this.articleTotalPages);
  }

  private sortCategories(items: BlogCategory[]): BlogCategory[] {
    return [...items].sort((a, b) => {
      if (this.categorySort === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  }

  private sortTags(items: BlogTag[]): BlogTag[] {
    return [...items].sort((a, b) => {
      if (this.tagSort === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  }

  private sortArticles(items: ArticleList[]): ArticleList[] {
    return [...items].sort((a, b) => {
      if (this.articleSort === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (this.articleSort === 'title_desc') {
        return b.title.localeCompare(a.title);
      }
      const dateA = new Date(a.published_at || a.created_at || '').getTime();
      const dateB = new Date(b.published_at || b.created_at || '').getTime();
      if (this.articleSort === 'date_asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }

  trackByCategory(index: number, item: BlogCategory): string {
    return item.slug || `${index}`;
  }

  trackByTag(index: number, item: BlogTag): string {
    return item.slug || `${index}`;
  }

  trackByArticle(index: number, item: ArticleList): string {
    return item.slug || `${index}`;
  }
}
