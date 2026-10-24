// src/app/features/home/home/home.ts
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../projects/services/project';
import { ArticleService } from '../../blog/services/article';
import { ProjectList } from '../../../core/models/project.model';
import { ArticleList } from '../../../core/models/article.model';
import { ExperienceItem } from '../../../core/models/experience.model';
import { UserService } from '../../../core/services/user.service';
import { ExperienceService } from '../../../core/services/experience.service';
import { SkillService } from '../../../core/services/skill.service';
import { GithubRepo, Testimonial, TestimonialService } from '../../../core/services/testimonial.service';
import { User } from '../../../core/models/auth.model';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
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
  imports: [RouterLink, IconComponent, RevealDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  private projectService = inject(ProjectService);
  private articleService = inject(ArticleService);
  private userService = inject(UserService);
  private experienceService = inject(ExperienceService);
  private skillService = inject(SkillService);
  private testimonialService = inject(TestimonialService);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly projects = signal<ProjectList[]>([]);
  readonly featuredArticles = signal<ArticleList[]>([]);
  readonly certifications = signal<ExperienceItem[]>([]);
  readonly current = signal<ExperienceItem | null>(null);
  readonly skillsCount = signal(0);
  readonly profile = signal<User | null>(null);
  readonly testimonials = signal<Testimonial[]>([]);
  readonly repos = signal<GithubRepo[]>([]);
  readonly ghUser = signal('');
  readonly loading = signal(true);
  readonly placeholderImage = 'assets/placeholders/project.svg';
  readonly profileFallback = 'assets/images/cv.jpg';

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

  /** Projet phare : le premier mis en avant, sinon le plus récent. */
  readonly featured = computed(() => this.projects().find(p => p.is_featured) ?? this.projects()[0] ?? null);

  readonly otherProjects = computed(() => {
    const featured = this.featured();
    return this.projects().filter(p => p !== featured).slice(0, 3);
  });

  readonly hasCaseStudy = computed(() => {
    const f = this.featured();
    return !!(f && (f.problem || f.solution || f.impact));
  });

  /** Seuls les chiffres réels et non nuls sont affichés : jamais de "0+". */
  readonly stats = computed<Stat[]>(() => [
    { value: this.projects().length, labelKey: 'home.stat.projects' },
    { value: this.certifications().length, labelKey: 'home.stat.certs' },
    { value: this.skillsCount(), labelKey: 'home.stat.skills' },
    { value: this.featuredArticles().length, labelKey: 'home.stat.articles' },
  ].filter(s => s.value > 0));

  /** Certifications regroupées par organisme, pour la ligne de logos. */
  readonly issuers = computed(() => {
    const counts = new Map<string, number>();
    for (const c of this.certifications()) {
      counts.set(c.company, (counts.get(c.company) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  });

  t(key: string): string {
    return this.lang.t(key);
  }

  ngOnInit(): void {
    this.loadProjects();
    this.loadArticles();
    this.loadExperiences();
    this.loadSkills();
    this.loadProfile();
    this.loadSocialProof();
  }

  techList(project: ProjectList, max = 5): string[] {
    return (project.technologies || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, max);
  }

  monthYear(iso: string): string {
    return new Date(iso).toLocaleDateString(this.lang.lang() === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' });
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  private loadProjects(): void {
    this.projectService.getProjects({ page_size: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (projects) => {
        const list = Array.isArray(projects) ? projects.filter(p => p.status !== 'archived') : [];
        // Mis en avant d'abord, le reste dans l'ordre de l'API.
        this.projects.set([...list.filter(p => p.is_featured), ...list.filter(p => !p.is_featured)]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadArticles(): void {
    this.articleService.getFeaturedArticles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (articles) => this.featuredArticles.set(Array.isArray(articles) ? articles : []),
      error: () => this.featuredArticles.set([])
    });
  }

  private loadExperiences(): void {
    this.experienceService.getExperiences({ page_size: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const list = Array.isArray(items) ? items : [];
        this.certifications.set(list
          .filter(e => e.type === 'certification')
          .sort((a, b) => b.start_date.localeCompare(a.start_date)));
        // Formation ou poste en cours le plus récent.
        this.current.set(list
          .filter(e => e.is_current && e.type !== 'certification')
          .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null);
      },
      error: () => this.certifications.set([])
    });
  }

  private loadSkills(): void {
    this.skillService.getCategoriesWithSkills().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cats) => this.skillsCount.set((cats || []).reduce((n, c) => n + (c.skills?.length ?? 0), 0)),
      error: () => this.skillsCount.set(0)
    });
  }

  private loadProfile(): void {
    this.userService.getPublicProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => this.profile.set(null)
    });
  }

  /** Témoignages publiés et dépôts GitHub : sections masquées si vides ou en erreur. */
  private loadSocialProof(): void {
    this.testimonialService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.testimonials.set((items || []).filter(i => i.is_published)),
      error: () => this.testimonials.set([])
    });
    this.testimonialService.githubRepos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.ghUser.set(res?.username || '');
        this.repos.set(res?.repos || []);
      },
      error: () => this.repos.set([])
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
