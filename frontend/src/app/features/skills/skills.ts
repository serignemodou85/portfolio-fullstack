// src/app/features/skills/skills.ts
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SkillService } from '../../core/services/skill.service';
import { SkillCategoryWithSkills } from '../../core/models/skill.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { resolveIconFromKeyword } from '../../shared/utils/icon-keyword';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [RouterLink, IconComponent, RevealDirective],
  templateUrl: './skills.html',
  styleUrl: './skills.scss'
})
export class Skills implements OnInit {
  private skillService = inject(SkillService);
  private destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly categories = signal<SkillCategoryWithSkills[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  t(key: string): string {
    return this.lang.t(key);
  }

  /** "2 ans", "1 an", "< 1 an" ; vide si non renseigné (la colonne reste pour aligner les niveaux). */
  yearsLabel(years: number | null | undefined): string {
    if (!years || years <= 0) return '';
    const fr = this.lang.lang() === 'fr';
    if (years < 1) return fr ? '< 1 an' : '< 1 yr';
    const n = Math.round(years);
    return fr ? `${n} an${n > 1 ? 's' : ''}` : `${n} yr${n > 1 ? 's' : ''}`;
  }

  ngOnInit(): void {
    this.skillService.getCategoriesWithSkills().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  proficiencyClass(level: number): string {
    if (level >= 4) {
      return 'expert';
    }
    if (level >= 3) {
      return 'advanced';
    }
    if (level >= 2) {
      return 'intermediate';
    }
    return 'beginner';
  }

  getCategoryIcon(icon: string | undefined, name: string): string {
    return resolveIconFromKeyword(icon || name);
  }
}
