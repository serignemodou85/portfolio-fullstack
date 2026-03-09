// src/app/features/skills/skills.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkillService } from '../../core/services/skill.service';
import { SkillCategoryWithSkills } from '../../core/models/skill.model';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './skills.html',
  styleUrl: './skills.scss'
})
export class Skills implements OnInit {
  categories: SkillCategoryWithSkills[] = [];
  loading = true;
  error: string | null = null;

  constructor(private skillService: SkillService) {}

  ngOnInit(): void {
    this.skillService.getCategoriesWithSkills().subscribe({
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
}
