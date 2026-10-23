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
import { ExperienceItem } from '../../../core/models/experience.model';
import { UserService } from '../../../core/services/user.service';
import { ExperienceService } from '../../../core/services/experience.service';
import { SkillService } from '../../../core/services/skill.service';
import { User } from '../../../core/models/auth.model';
import { environment } from '../../../../environments/environment';
import { LanguageService, Lang } from '../../../core/services/language.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

interface Stat {
  value: number;
  labelKey: string;
}

interface Expertise {
  key: 'data' | 'ml' | 'backend' | 'frontend';
  icon: string;
  stack: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, RevealDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  projects: ProjectList[] = [];
  featuredArticles: ArticleList[] = [];
  certifications: ExperienceItem[] = [];
  current: ExperienceItem | null = null;
  skillsCount = 0;
  profile: User | null = null;
  loading = true;
  lang: Lang = 'fr';
  readonly placeholderImage = 'assets/placeholders/project.svg';
  readonly profileFallback = 'assets/images/cv.jpg';
  private destroy$ = new Subject<void>();

  // Étapes réelles de ta chaîne data, avec les outils présents dans tes compétences.
  readonly pipeline = [
    { key: 'sources', icon: 'database' },
    { key: 'transform', icon: 'refresh' },
    { key: 'model', icon: 'cpu' },
    { key: 'serve', icon: 'chart' },
  ];

  readonly expertise: Expertise[] = [
    { key: 'data', icon: 'database', stack: ['Python', 'SQL', 'Spark', 'Airflow', 'Pentaho', 'Jupyter'] },
    { key: 'ml', icon: 'cpu', stack: ['Python', 'Dataiku', 'Jupyter'] },
    { key: 'backend', icon: 'server', stack: ['Django', 'Laravel', 'MySQL', 'SQL Server'] },
    { key: 'frontend', icon: 'monitor', stack: ['Angular', 'Power BI', 'Tableau', 'Streamlit'] },
  ];

  constructor(
    private projectService: ProjectService,
    private articleService: ArticleService,
    private userService: UserService,
    private experienceService: ExperienceService,
    private skillService: SkillService,
    private langService: LanguageService
  ) {
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe(l => this.lang = l);
  }

  t(key: string): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.loadProjects();
    this.loadArticles();
    this.loadExperiences();
    this.loadSkills();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Projet phare : le premier mis en avant, sinon le plus récent. */
  get featured(): ProjectList | null {
    return this.projects.find(p => p.is_featured) ?? this.projects[0] ?? null;
  }

  get otherProjects(): ProjectList[] {
    const featured = this.featured;
    return this.projects.filter(p => p !== featured).slice(0, 3);
  }

  get hasCaseStudy(): boolean {
    const f = this.featured;
    return !!(f && (f.problem || f.solution || f.impact));
  }

  /** Seuls les chiffres réels et non nuls sont affichés : jamais de "0+". */
  get stats(): Stat[] {
    return [
      { value: this.projects.length, labelKey: 'home.stat.projects' },
      { value: this.certifications.length, labelKey: 'home.stat.certs' },
      { value: this.skillsCount, labelKey: 'home.stat.skills' },
      { value: this.featuredArticles.length, labelKey: 'home.stat.articles' },
    ].filter(s => s.value > 0);
  }

  /** Certifications regroupées par organisme, pour la ligne de logos. */
  get issuers(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const c of this.certifications) {
      counts.set(c.company, (counts.get(c.company) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }

  techList(project: ProjectList, max = 5): string[] {
    return (project.technologies || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, max);
  }

  monthYear(iso: string): string {
    return new Date(iso).toLocaleDateString(this.lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' });
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  private loadProjects(): void {
    this.projectService.getProjects({ page_size: 50 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (projects) => {
        const list = Array.isArray(projects) ? projects.filter(p => p.status !== 'archived') : [];
        // Mis en avant d'abord, le reste dans l'ordre de l'API.
        this.projects = [...list.filter(p => p.is_featured), ...list.filter(p => !p.is_featured)];
        this.loading = false;
      },
      error: () => {
        this.projects = [];
        this.loading = false;
      }
    });
  }

  private loadArticles(): void {
    this.articleService.getFeaturedArticles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (articles) => { this.featuredArticles = Array.isArray(articles) ? articles : []; },
      error: () => { this.featuredArticles = []; }
    });
  }

  private loadExperiences(): void {
    this.experienceService.getExperiences({ page_size: 100 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        const list = Array.isArray(items) ? items : [];
        this.certifications = list
          .filter(e => e.type === 'certification')
          .sort((a, b) => b.start_date.localeCompare(a.start_date));
        // Formation ou poste en cours le plus récent.
        this.current = list
          .filter(e => e.is_current && e.type !== 'certification')
          .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null;
      },
      error: () => { this.certifications = []; }
    });
  }

  private loadSkills(): void {
    this.skillService.getCategoriesWithSkills().pipe(takeUntil(this.destroy$)).subscribe({
      next: (cats) => { this.skillsCount = (cats || []).reduce((n, c) => n + (c.skills?.length ?? 0), 0); },
      error: () => { this.skillsCount = 0; }
    });
  }

  private loadProfile(): void {
    this.userService.getPublicProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profile) => { this.profile = profile; },
      error: () => { this.profile = null; }
    });
  }

  getImageUrl(url?: string | null): string {
    return url || this.placeholderImage;
  }

  getProfileImageUrl(url?: string | null): string {
    if (!url) {
      return this.profileFallback;
    }
    if (/^(https?:\/\/|assets\/|\/)/.test(url)) {
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
    if (img && !img.src.endsWith(this.placeholderImage)) {
      img.src = this.placeholderImage;
    }
  }

  onProfileError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.endsWith(this.profileFallback)) {
      img.src = this.profileFallback;
    }
  }
}
