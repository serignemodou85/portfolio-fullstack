// src/app/features/experience/experience.ts
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ExperienceService } from '../../core/services/experience.service';
import { ExperienceItem } from '../../core/models/experience.model';
import { LanguageService } from '../../core/services/language.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

type TypeFilter = 'all' | ExperienceItem['type'];

interface YearGroup {
  year: string;
  items: ExperienceItem[];
}

const PAGE_SIZE = 8;

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [RouterLink, IconComponent, RevealDirective],
  templateUrl: './experience.html',
  styleUrl: './experience.scss'
})
export class Experience implements OnInit {
  private experienceService = inject(ExperienceService);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly filters: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'exp.filter.all' },
    { key: 'work', label: 'exp.filter.work' },
    { key: 'education', label: 'exp.filter.edu' },
    { key: 'certification', label: 'exp.filter.cert' },
  ];
  readonly typeIcon: Record<ExperienceItem['type'], string> = {
    work: 'briefcase',
    education: 'graduation',
    certification: 'award',
  };

  readonly experiences = signal<ExperienceItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly type = signal<TypeFilter>('all');
  readonly visible = signal(PAGE_SIZE);

  readonly counts = computed(() => {
    const list = this.experiences();
    return {
      all: list.length,
      work: list.filter(e => e.type === 'work').length,
      education: list.filter(e => e.type === 'education').length,
      certification: list.filter(e => e.type === 'certification').length,
    } as Record<TypeFilter, number>;
  });

  /** Chiffres clés : seuls les compteurs non nuls sont affichés. */
  readonly stats = computed(() => [
    { value: this.counts().work, label: 'exp.filter.work' },
    { value: this.counts().education, label: 'exp.filter.edu' },
    { value: this.counts().certification, label: 'exp.stat.certs' },
    { value: this.experiences().filter(e => e.is_current).length, label: 'exp.stat.current' },
  ].filter(s => s.value > 0));

  readonly filtered = computed(() => {
    const type = this.type();
    return type === 'all' ? this.experiences() : this.experiences().filter(e => e.type === type);
  });

  /** Éléments affichés, regroupés par année de début (le plus récent en haut). */
  readonly groups = computed<YearGroup[]>(() => {
    const groups: YearGroup[] = [];
    for (const item of this.filtered().slice(0, this.visible())) {
      const year = item.start_date.slice(0, 4);
      const last = groups[groups.length - 1];
      if (last?.year === year) {
        last.items.push(item);
      } else {
        groups.push({ year, items: [item] });
      }
    }
    return groups;
  });

  readonly hasMore = computed(() => this.filtered().length > this.visible());

  ngOnInit(): void {
    this.experienceService.getExperiences({ page_size: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        // Du plus récent au plus ancien (les groupes par année restent ainsi ordonnés).
        const sorted = [...(items || [])].sort((a, b) => b.start_date.localeCompare(a.start_date));
        this.experiences.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  t(key: string): string {
    return this.lang.t(key);
  }

  setType(type: TypeFilter): void {
    this.type.set(type);
    this.visible.set(PAGE_SIZE);
  }

  showMore(): void {
    this.visible.update(n => n + PAGE_SIZE);
  }

  monthYear(iso: string): string {
    return new Date(iso).toLocaleDateString(this.lang.lang() === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' });
  }

  /** Durée lisible ("1 an 4 mois") ; vide pour les certifications ponctuelles. */
  duration(item: ExperienceItem): string {
    if (item.type === 'certification') {
      return '';
    }
    const start = new Date(item.start_date);
    const end = item.end_date ? new Date(item.end_date) : new Date();
    const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts: string[] = [];
    if (years) {
      parts.push(`${years} ${this.t(years > 1 ? 'exp.duration.years' : 'exp.duration.year')}`);
    }
    if (rest) {
      parts.push(`${rest} ${this.t('exp.duration.month')}`);
    }
    return parts.join(' ');
  }
}
