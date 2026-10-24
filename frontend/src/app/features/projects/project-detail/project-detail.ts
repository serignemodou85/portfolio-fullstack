// src/app/features/projects/project-detail/project-detail.ts
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../services/project';
import { ProjectDetail as ProjectDetailModel } from '../../../core/models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { SeoService } from '../../../core/services/seo.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

interface CaseStep {
  key: 'context' | 'problem' | 'solution' | 'impact';
  text: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, RevealDirective],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private seo = inject(SeoService);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly placeholderImage = 'assets/placeholders/project.svg';
  readonly project = signal<ProjectDetailModel | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly technologies = computed(() =>
    (this.project()?.technologies || '').split(',').map(t => t.trim()).filter(Boolean)
  );

  /** Blocs de l'étude de cas, dans l'ordre, uniquement ceux qui sont remplis. */
  readonly caseSteps = computed<CaseStep[]>(() => {
    const p = this.project();
    if (!p) {
      return [];
    }
    return (['context', 'problem', 'solution', 'impact'] as const)
      .map(key => ({ key, text: (p[key] || '').trim() }))
      .filter(step => step.text);
  });

  readonly gallery = computed(() => {
    const p = this.project();
    return p ? [p.image_1, p.image_2, p.image_3].filter((src): src is string => !!src) : [];
  });

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

  /** "mars 2025 – aujourd'hui", "2024 – 2025"... selon la langue. */
  period(project: ProjectDetailModel): string {
    const fmt = (iso: string) => new Date(iso).toLocaleDateString(this.lang.lang() === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' });
    if (!project.start_date) {
      return '';
    }
    const end = project.end_date ? fmt(project.end_date) : this.t('project.today');
    return `${fmt(project.start_date)} – ${end}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.endsWith(this.placeholderImage)) {
      img.src = this.placeholderImage;
    }
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.projectService.getProjectBySlug(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (project) => {
        if (project.status === 'archived') {
          this.notFound.set(true);
        } else {
          this.project.set(project);
          this.seo.setPage({ title: project.title, description: project.description, image: project.thumbnail });
        }
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }
}
