// src/app/features/admin/blog-admin/blog-admin.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { ArticleList } from '../../../core/models/article.model';
import { BlogCategory, BlogTag } from '../../../core/models/blog.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { LanguageService } from '../../../core/services/language.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { byDate, byText, tableState } from '../../../core/utils/table-state';

type NameSort = 'name_asc' | 'name_desc';
type ArticleSort = 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc';

const emptyArticle = () => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags_ids: [] as number[],
  status: 'draft' as ArticleList['status'],
  is_featured: false,
  reading_time: 5,
  published_at: ''
});

const nameCompare = <T extends { name: string }>(sort: NameSort) => byText<T>(item => item.name, sort === 'name_asc' ? 1 : -1);
const articleDate = (a: ArticleList) => a.published_at || a.created_at;

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, AdminShell, PagerComponent],
  templateUrl: './blog-admin.html',
  styleUrl: './blog-admin.scss'
})
export class BlogAdmin implements OnInit {
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  lang = inject(LanguageService);

  readonly categories = signal<BlogCategory[]>([]);
  readonly tags = signal<BlogTag[]>([]);
  readonly articles = signal<ArticleList[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingCategorySlug = signal<string | null>(null);
  readonly editingTagSlug = signal<string | null>(null);
  readonly editingArticleSlug = signal<string | null>(null);

  /** Modèles des formulaires (template-driven, liés par ngModel). */
  categoryForm = { name: '', slug: '', description: '' };
  tagForm = { name: '', slug: '' };
  articleForm = emptyArticle();
  private featuredImage: File | null = null;

  readonly categoryTable = tableState<BlogCategory, NameSort>(this.categories, {
    sort: 'name_asc',
    searchIn: c => [c.name, c.slug, c.description],
    compare: nameCompare,
  });

  readonly tagTable = tableState<BlogTag, NameSort>(this.tags, {
    sort: 'name_asc',
    searchIn: t => [t.name, t.slug],
    compare: nameCompare,
  });

  readonly articleTable = tableState<ArticleList, ArticleSort>(this.articles, {
    sort: 'date_desc',
    searchIn: a => [a.title, a.excerpt, a.category_name],
    compare: sort => ({
      date_desc: byDate<ArticleList>(articleDate, -1),
      date_asc: byDate<ArticleList>(articleDate, 1),
      title_asc: byText<ArticleList>(a => a.title, 1),
      title_desc: byText<ArticleList>(a => a.title, -1),
    })[sort],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.blogService.getCategories({ page_size: 1000 }).subscribe({
      next: (items) => this.categories.set(items),
      error: () => this.error.set('Erreur de chargement des catégories.')
    });
    this.blogService.getTags({ page_size: 1000 }).subscribe({
      next: (items) => this.tags.set(items),
      error: () => this.error.set('Erreur de chargement des tags.')
    });
    this.blogService.getArticles({ page_size: 1000 }).subscribe({
      next: (items) => {
        this.articles.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erreur de chargement des articles.');
        this.loading.set(false);
      }
    });
  }

  // ── Catégories ───────────────────────────────────────────────────────────

  submitCategory(): void {
    const slug = this.editingCategorySlug();
    const request$ = slug
      ? this.blogService.updateCategory(slug, this.categoryForm)
      : this.blogService.createCategory(this.categoryForm);
    request$.subscribe({
      next: () => {
        this.toastService.success(slug ? 'Catégorie mise à jour.' : 'Catégorie créée.');
        this.resetCategory();
        this.loadAll();
      },
      error: (err) => this.error.set(apiErrorMessage(err, 'Erreur lors de la sauvegarde de la catégorie.'))
    });
  }

  editCategory(cat: BlogCategory): void {
    this.editingCategorySlug.set(cat.slug);
    this.categoryForm = { name: cat.name, slug: cat.slug, description: cat.description || '' };
  }

  deleteCategory(cat: BlogCategory): void {
    this.confirmDelete('Supprimer la catégorie', `Supprimer "${cat.name}" ? Les articles associés perdront leur catégorie.`, () =>
      this.blogService.deleteCategory(cat.slug).subscribe({
        next: () => { this.toastService.success('Catégorie supprimée.'); this.loadAll(); },
        error: () => this.toastService.error('Erreur lors de la suppression de la catégorie.')
      })
    );
  }

  resetCategory(): void {
    this.editingCategorySlug.set(null);
    this.categoryForm = { name: '', slug: '', description: '' };
  }

  // ── Tags ─────────────────────────────────────────────────────────────────

  submitTag(): void {
    const slug = this.editingTagSlug();
    const request$ = slug ? this.blogService.updateTag(slug, this.tagForm) : this.blogService.createTag(this.tagForm);
    request$.subscribe({
      next: () => {
        this.toastService.success(slug ? 'Tag mis à jour.' : 'Tag créé.');
        this.resetTag();
        this.loadAll();
      },
      error: (err) => this.error.set(apiErrorMessage(err, 'Erreur lors de la sauvegarde du tag.'))
    });
  }

  editTag(tag: BlogTag): void {
    this.editingTagSlug.set(tag.slug);
    this.tagForm = { name: tag.name, slug: tag.slug };
  }

  deleteTag(tag: BlogTag): void {
    this.confirmDelete('Supprimer le tag', `Supprimer le tag "${tag.name}" ?`, () =>
      this.blogService.deleteTag(tag.slug).subscribe({
        next: () => { this.toastService.success('Tag supprimé.'); this.loadAll(); },
        error: () => this.toastService.error('Erreur lors de la suppression du tag.')
      })
    );
  }

  resetTag(): void {
    this.editingTagSlug.set(null);
    this.tagForm = { name: '', slug: '' };
  }

  // ── Articles ─────────────────────────────────────────────────────────────

  onImageSelected(event: Event): void {
    this.featuredImage = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  toggleTag(tagId: number, checked: boolean): void {
    const ids = this.articleForm.tags_ids.filter(id => id !== tagId);
    this.articleForm.tags_ids = checked ? [...ids, tagId] : ids;
  }

  submitArticle(): void {
    const payload = new FormData();
    Object.entries(this.articleForm).forEach(([key, value]) => {
      if (key === 'tags_ids') {
        (value as number[]).forEach(id => payload.append('tags_ids', String(id)));
      } else if (value !== null && value !== '') {
        payload.append(key, String(value));
      }
    });
    if (this.featuredImage) {
      payload.append('featured_image', this.featuredImage);
    }

    const slug = this.editingArticleSlug();
    const request$ = slug ? this.blogService.partialUpdateArticle(slug, payload) : this.blogService.createArticle(payload);
    request$.subscribe({
      next: () => {
        this.toastService.success(slug ? 'Article mis à jour.' : 'Article créé.');
        this.resetArticleForm();
        this.loadAll();
      },
      error: (err) => this.error.set(apiErrorMessage(err, 'Erreur lors de la sauvegarde de l\'article.'))
    });
  }

  editArticle(article: ArticleList): void {
    this.editingArticleSlug.set(article.slug);
    this.featuredImage = null;
    this.blogService.getArticle(article.slug).subscribe({
      next: (detail) => {
        this.articleForm = {
          title: detail.title,
          slug: detail.slug,
          excerpt: detail.excerpt,
          content: detail.content || '',
          category: detail.category?.id ? String(detail.category.id) : '',
          tags_ids: detail.tags?.map(t => t.id) || [],
          status: detail.status,
          is_featured: !!detail.is_featured,
          reading_time: detail.reading_time,
          published_at: this.toDateTimeLocalValue(detail.published_at)
        };
      },
      error: () => this.error.set('Erreur de chargement de l\'article.')
    });
  }

  deleteArticle(article: ArticleList): void {
    this.confirmDelete('Supprimer l\'article', `Supprimer "${article.title}" ? Cette action est irréversible.`, () =>
      this.blogService.deleteArticle(article.slug).subscribe({
        next: () => {
          this.toastService.success('Article supprimé.');
          this.articles.update(list => list.filter(a => a.slug !== article.slug));
        },
        error: () => this.toastService.error('Erreur lors de la suppression de l\'article.')
      })
    );
  }

  resetArticleForm(): void {
    this.editingArticleSlug.set(null);
    this.featuredImage = null;
    this.articleForm = emptyArticle();
  }

  statusLabel(status: string): string {
    return this.lang.t(`admin.blog.art.${status === 'published' || status === 'archived' ? status : 'draft'}`);
  }

  private confirmDelete(title: string, message: string, action: () => void): void {
    this.confirmService.confirm({ title, message, confirmLabel: 'Supprimer' }).subscribe(confirmed => {
      if (confirmed) {
        action();
      }
    });
  }

  /** ISO → valeur d'un <input type="datetime-local"> dans le fuseau du navigateur. */
  private toDateTimeLocalValue(value?: string | null): string {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return '';
    }
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
}
