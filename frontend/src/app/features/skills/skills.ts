// src/app/features/skills/skills.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SkillService } from '../../core/services/skill.service';
import { SkillCategoryWithSkills } from '../../core/models/skill.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { resolveIconFromKeyword } from '../../shared/utils/icon-keyword';
import { LanguageService, Lang } from '../../core/services/language.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './skills.html',
  styleUrl: './skills.scss'
})
export class Skills implements OnInit, OnDestroy {
  categories: SkillCategoryWithSkills[] = [];
  loading = true;
  error: string | null = null;
  lang: Lang = 'fr';
  private destroy$ = new Subject<void>();

  constructor(
    private skillService: SkillService,
    private langService: LanguageService
  ) {
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe(l => this.lang = l);
  }

  t(key: string): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.skillService.getCategoriesWithSkills().pipe(takeUntil(this.destroy$)).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les compétences.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
