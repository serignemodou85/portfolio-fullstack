// src/app/features/admin/skills-admin/skills-admin.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SkillService } from '../../../core/services/skill.service';
import { SkillCategory, SkillItem } from '../../../core/models/skill.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ICON_SUGGESTIONS, resolveIconFromKeyword } from '../../../shared/utils/icon-keyword';

@Component({
  selector: 'app-skills-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './skills-admin.html',
  styleUrl: './skills-admin.scss'
})
export class SkillsAdmin implements OnInit {
  readonly iconSuggestions = ICON_SUGGESTIONS;
  categories: SkillCategory[] = [];
  skills: SkillItem[] = [];
  error: string | null = null;

  editingCategoryId: number | null = null;
  categoryForm: {
    name: string;
    icon: string;
    order: number;
  } = {
    name: '',
    icon: '',
    order: 0
  };

  editingSkillId: number | null = null;
  skillForm: {
    name: string;
    category: number | null;
    proficiency: 1 | 2 | 3 | 4;
    percentage: number;
    icon: string;
    years_of_experience: number;
    order: number;
  } = {
    name: '',
    category: null,
    proficiency: 2,
    percentage: 50,
    icon: '',
    years_of_experience: 0,
    order: 0
  };

  constructor(private skillService: SkillService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.skillService.getCategories().subscribe({
      next: (items) => {
        this.categories = items;
        if (!this.skillForm.category && items.length && items[0].id) {
          this.skillForm.category = items[0].id;
        }
      },
      error: () => (this.error = 'Erreur chargement categories.')
    });
    this.skillService.getSkills().subscribe({
      next: (items) => (this.skills = items),
      error: () => (this.error = 'Erreur chargement skills.')
    });
  }

  submitCategory(): void {
    if (!this.categoryForm.icon.trim()) {
      this.categoryForm.icon = this.suggestIcon(this.categoryForm.name);
    }
    const payload: Partial<SkillCategory> = { ...this.categoryForm };
    const request$ = this.editingCategoryId
      ? this.skillService.updateCategory(this.editingCategoryId, payload)
      : this.skillService.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.resetCategory();
        this.loadAll();
      },
      error: () => (this.error = 'Erreur sauvegarde categorie.')
    });
  }

  editCategory(cat: SkillCategory): void {
    if (!cat.id) {
      return;
    }
    this.editingCategoryId = cat.id;
    this.categoryForm = {
      name: cat.name,
      icon: cat.icon || '',
      order: cat.order
    };
  }

  deleteCategory(id: number): void {
    const confirmed = window.confirm('Supprimer cette categorie ?');
    if (!confirmed) {
      return;
    }
    this.skillService.deleteCategory(id).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Erreur suppression categorie.')
    });
  }

  resetCategory(): void {
    this.editingCategoryId = null;
    this.categoryForm = { name: '', icon: '', order: 0 };
  }

  submitSkill(): void {
    if (!this.skillForm.category) {
      this.error = 'Creez ou selectionnez une categorie avant d ajouter une competence.';
      return;
    }
    const payload: Partial<SkillItem> = {
      ...this.skillForm,
      category: this.skillForm.category
    };
    const request$ = this.editingSkillId
      ? this.skillService.updateSkill(this.editingSkillId, payload)
      : this.skillService.createSkill(payload);

    request$.subscribe({
      next: () => {
        this.resetSkill();
        this.loadAll();
      },
      error: () => (this.error = 'Erreur sauvegarde skill.')
    });
  }

  editSkill(skill: SkillItem): void {
    this.editingSkillId = skill.id;
    this.skillForm = {
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      percentage: skill.percentage,
      icon: skill.icon || '',
      years_of_experience: Number(skill.years_of_experience),
      order: skill.order
    };
  }

  deleteSkill(id: number): void {
    const confirmed = window.confirm('Supprimer cette competence ?');
    if (!confirmed) {
      return;
    }
    this.skillService.deleteSkill(id).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Erreur suppression skill.')
    });
  }

  resetSkill(): void {
    this.editingSkillId = null;
    this.skillForm = {
      name: '',
      category: this.categories[0]?.id || null,
      proficiency: 2,
      percentage: 50,
      icon: '',
      years_of_experience: 0,
      order: 0
    };
  }

  onCategoryNameInput(): void {
    if (!this.categoryForm.icon.trim()) {
      this.categoryForm.icon = this.suggestIcon(this.categoryForm.name);
    }
  }

  normalizeCategoryIcon(): void {
    this.categoryForm.icon = this.suggestIcon(this.categoryForm.icon || this.categoryForm.name);
  }

  useSuggestedIcon(icon: string): void {
    this.categoryForm.icon = icon;
  }

  getCategoryIconPreview(value?: string, fallback?: string): string {
    return resolveIconFromKeyword(value || fallback || '');
  }

  private suggestIcon(keyword: string): string {
    return resolveIconFromKeyword(keyword);
  }
}
