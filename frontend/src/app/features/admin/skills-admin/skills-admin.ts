// src/app/features/admin/skills-admin/skills-admin.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SkillService } from '../../../core/services/skill.service';
import { SkillCategory, SkillItem } from '../../../core/models/skill.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ICON_SUGGESTIONS, resolveIconFromKeyword } from '../../../shared/utils/icon-keyword';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-skills-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, AdminShell],
  templateUrl: './skills-admin.html',
  styleUrl: './skills-admin.scss'
})
export class SkillsAdmin implements OnInit {
  readonly iconSuggestions = ICON_SUGGESTIONS;
  categories: SkillCategory[] = [];
  skills: SkillItem[] = [];
  error: string | null = null;
  pageSize = 5;
  pageSizeOptions = [4, 5, 10, 20];
  categoryPage = 1;
  skillPage = 1;
  categorySearch = '';
  skillSearch = '';
  categorySort: 'name_asc' | 'name_desc' | 'order_asc' = 'order_asc';
  skillSort: 'name_asc' | 'name_desc' | 'order_asc' | 'proficiency_desc' = 'order_asc';

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
    this.skillService.getCategories({ page_size: 1000 }).subscribe({
      next: (items) => {
        this.categories = items;
        this.syncCategoryPage();
        if (!this.skillForm.category && items.length && items[0].id) {
          this.skillForm.category = items[0].id;
        }
      },
      error: () => (this.error = 'Erreur chargement categories.')
    });
    this.skillService.getSkills({ page_size: 1000 }).subscribe({
      next: (items) => {
        this.skills = items;
        this.syncSkillPage();
      },
      error: () => (this.error = 'Erreur chargement skills.')
    });
  }

  get pagedCategories(): SkillCategory[] {
    return this.paginate(this.processedCategories, this.categoryPage);
  }

  get pagedSkills(): SkillItem[] {
    return this.paginate(this.processedSkills, this.skillPage);
  }

  get categoryTotalPages(): number {
    return Math.max(1, Math.ceil(this.processedCategories.length / this.pageSize));
  }

  get skillTotalPages(): number {
    return Math.max(1, Math.ceil(this.processedSkills.length / this.pageSize));
  }

  setCategoryPage(page: number): void {
    this.categoryPage = this.clampPage(page, this.categoryTotalPages);
  }

  setSkillPage(page: number): void {
    this.skillPage = this.clampPage(page, this.skillTotalPages);
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.syncCategoryPage();
    this.syncSkillPage();
  }

  get processedCategories(): SkillCategory[] {
    const query = this.categorySearch.trim().toLowerCase();
    let items = this.categories;
    if (query) {
      items = items.filter((cat) =>
        [cat.name, cat.icon].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
      );
    }
    return this.sortCategories(items);
  }

  get processedSkills(): SkillItem[] {
    const query = this.skillSearch.trim().toLowerCase();
    let items = this.skills;
    if (query) {
      items = items.filter((skill) =>
        [skill.name, skill.icon, skill.category_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }
    return this.sortSkills(items);
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

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private clampPage(page: number, total: number): number {
    return Math.min(Math.max(page, 1), total);
  }

  private syncCategoryPage(): void {
    this.categoryPage = this.clampPage(this.categoryPage, this.categoryTotalPages);
  }

  private syncSkillPage(): void {
    this.skillPage = this.clampPage(this.skillPage, this.skillTotalPages);
  }

  private sortCategories(items: SkillCategory[]): SkillCategory[] {
    return [...items].sort((a, b) => {
      if (this.categorySort === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (this.categorySort === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }

  private sortSkills(items: SkillItem[]): SkillItem[] {
    return [...items].sort((a, b) => {
      if (this.skillSort === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (this.skillSort === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (this.skillSort === 'proficiency_desc') {
        return (b.proficiency ?? 0) - (a.proficiency ?? 0);
      }
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }

  trackByCategory(index: number, item: SkillCategory): number {
    return item.id ?? index;
  }

  trackBySkill(index: number, item: SkillItem): number {
    return item.id ?? index;
  }
}
