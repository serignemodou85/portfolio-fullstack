// src/app/features/home/home/home.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService } from '../../projects/services/project';
import { ArticleService } from '../../blog/services/article';
import { ProjectList } from '../../../core/models/project.model';
import { ArticleList } from '../../../core/models/article.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/auth.model';
import { environment } from '../../../../environments/environment';
import { LanguageService, Lang } from '../../../core/services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  featuredProjects: ProjectList[] = [];
  featuredArticles: ArticleList[] = [];
  profile: User | null = null;
  loading = true;
  lang: Lang = 'fr';
  readonly placeholderImage = 'assets/placeholders/project.svg';
  readonly profileFallback = 'assets/images/cv.jpg';
  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private articleService: ArticleService,
    private userService: UserService,
    private langService: LanguageService
  ) {
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe(l => this.lang = l);
  }

  t(key: string): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.loadFeaturedContent();
    this.loadProfile();
  }

  loadFeaturedContent(): void {
    let done = 0;
    const checkDone = () => {
      done++;
      if (done >= 2) this.loading = false;
    };

    this.projectService.getProjects({ is_featured: true }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (projects) => {
        this.featuredProjects = Array.isArray(projects)
          ? projects.filter((project) => project.status !== 'archived').slice(0, 3)
          : [];
      },
      error: () => { this.featuredProjects = []; },
      complete: checkDone
    });

    this.articleService.getFeaturedArticles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (articles) => {
        this.featuredArticles = Array.isArray(articles) ? articles : [];
      },
      error: () => { this.featuredArticles = []; },
      complete: checkDone
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.userService.getPublicProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profile) => {
        this.profile = profile;
      },
      error: () => {
        this.profile = null;
      }
    });
  }

  getImageUrl(url?: string | null): string {
    if (!url) {
      return this.placeholderImage;
    }
    return url;
  }

  getProfileImageUrl(url?: string | null): string {
    if (!url) {
      return this.profileFallback;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('assets/')) {
      return url;
    }
    if (url.startsWith('/')) {
      return url;
    }
    if (!url.includes('/')) {
      return this.profileFallback;
    }
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    const cleanPath = url.startsWith('media/') ? url : `media/${url}`;
    return `${base}/${cleanPath}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }

  onProfileError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.profileFallback) {
      img.src = this.profileFallback;
    }
  }
}
