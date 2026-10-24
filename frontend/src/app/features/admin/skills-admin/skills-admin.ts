// src/app/features/admin/skills-admin/skills-admin.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SkillService } from '../../../core/services/skill.service';
import { SkillCategory, SkillItem } from '../../../core/models/skill.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ICON_SUGGESTIONS, resolveIconFromKeyword } from '../../../shared/utils/icon-keyword';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { LanguageService } from '../../../core/services/language.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { byText, tableState } from '../../../core/utils/table-state';

type CategorySort = 'name_asc' | 'name_desc' | 'order_asc';
type SkillSort = 'name_asc' | 'name_desc' | 'order_asc' | 'proficiency_desc';

interface SkillFormModel {
  name: string;
  category: number | null;
  proficiency: 1 | 2 | 3 | 4;
  percentage: number;
  icon: string;
  years_of_experience: number;
  order: number;
}

const byOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0);

@Component({
  selector: 'app-skills-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, AdminShell, PagerComponent],
  templateUrl: './skills-admin.html',
  styleUrl: './skills-admin.scss'
})
export class SkillsAdmin implements OnInit {
  private skillService = inject(SkillService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  lang = inject(LanguageService);

  readonly iconSuggestions = ICON_SUGGESTIONS;
  readonly levels = [1, 2, 3, 4] as const;
  readonly categories = signal<SkillCategory[]>([]);
  readonly skills = signal<SkillItem[]>([]);
  readonly error = signal<string | null>(null);
  readonly editingCategoryId = signal<number | null>(null);
  readonly editingSkillId = signal<number | null>(null);

  /** Modèles des formulaires (template-driven, liés par ngModel). */
  categoryForm = { name: '', icon: '', order: 0 };
  skillForm: SkillFormModel = this.emptySkill();

  readonly categoryTable = tableState<SkillCategory, CategorySort>(this.categories, {
    sort: 'order_asc',
    searchIn: c => [c.name, c.icon],
    compare: sort => ({
      order_asc: byOrder,
      name_asc: byText<SkillCategory>(c => c.name, 1),
      name_desc: byText<SkillCategory>(c => c.name, -1),
    })[sort],
  });

  readonly skillTable = tableState<SkillItem, SkillSort>(this.skills, {
    sort: 'order_asc',
    searchIn: s => [s.name, s.icon, s.category_name],
    compare: sort => ({
      order_asc: byOrder,
      name_asc: byText<SkillItem>(s => s.name, 1),
      name_desc: byText<SkillItem>(s => s.name, -1),
      proficiency_desc: (a: SkillItem, b: SkillItem) => (b.proficiency ?? 0) - (a.proficiency ?? 0),
    })[sort],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.skillService.getCategories({ page_size: 1000 }).subscribe({
      next: (items) => {
        this.categories.set(items);
        if (!this.skillForm.category && items[0]?.id) {
          this.skillForm.category = items[0].id;
        }
      },
      error: () => this.error.set('Erreur de chargement des catégories.')
    });
    this.skillService.getSkills({ page_size: 1000 }).subscribe({
      next: (items) => this.skills.set(items),
      error: () => this.error.set('Erreur de chargement des compétences.')
    });
  }

  // ── Catégories ───────────────────────────────────────────────────────────

  submitCategory(): void {
    if (!this.categoryForm.icon.trim()) {
      this.categoryForm.icon = resolveIconFromKeyword(this.categoryForm.name);
    }
    const id = this.editingCategoryId();
    const payload: Partial<SkillCategory> = { ...this.categoryForm };
    const request$ = id ? this.skillService.updateCategory(id, payload) : this.skillService.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(id ? 'Catégorie mise à jour.' : 'Catégorie créée.');
        this.resetCategory();
        this.loadAll();
      },
      error: (err) => this.error.set(apiErrorMessage(err, 'Erreur lors de la sauvegarde de la catégorie.'))
    });
  }

  editCategory(cat: SkillCategory): void {
    if (!cat.id) {
      return;
    }
    this.editingCategoryId.set(cat.id);
    this.categoryForm = { name: cat.name, icon: cat.icon || '', order: cat.order };
  }

  deleteCategory(cat: SkillCategory): void {
    if (!cat.id) {
      return;
    }
    this.confirmService.confirm({
      title: 'Supprimer la catégorie',
      message: `Supprimer "${cat.name}" ? Les compétences associées seront aussi supprimées.`,
      confirmLabel: 'Supprimer'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.skillService.deleteCategory(cat.id!).subscribe({
        next: () => { this.toastService.success('Catégorie supprimée.'); this.loadAll(); },
        error: () => this.toastService.error('Erreur lors de la suppression de la catégorie.')
      });
    });
  }

  resetCategory(): void {
    this.editingCategoryId.set(null);
    this.categoryForm = { name: '', icon: '', order: 0 };
  }

  onCategoryNameInput(): void {
    if (!this.categoryForm.icon.trim()) {
      this.categoryForm.icon = resolveIconFromKeyword(this.categoryForm.name);
    }
  }

  normalizeCategoryIcon(): void {
    this.categoryForm.icon = resolveIconFromKeyword(this.categoryForm.icon || this.categoryForm.name);
  }

  iconPreview(value?: string, fallback?: string): string {
    return resolveIconFromKeyword(value || fallback || '');
  }

  // ── Compétences ──────────────────────────────────────────────────────────

  submitSkill(): void {
    if (!this.skillForm.category) {
      this.error.set('Créez ou sélectionnez une catégorie avant d\'ajouter une compétence.');
      return;
    }
    const id = this.editingSkillId();
    const payload = { ...this.skillForm, category: this.skillForm.category } as Partial<SkillItem>;
    const request$ = id ? this.skillService.updateSkill(id, payload) : this.skillService.createSkill(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(id ? 'Compétence mise à jour.' : 'Compétence ajoutée.');
        this.resetSkill();
        this.loadAll();
      },
      error: (err) => this.error.set(apiErrorMessage(err, 'Erreur lors de la sauvegarde de la compétence.'))
    });
  }

  editSkill(skill: SkillItem): void {
    this.editingSkillId.set(skill.id);
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

  deleteSkill(skill: SkillItem): void {
    this.confirmService.confirm({
      title: 'Supprimer la compétence',
      message: `Supprimer "${skill.name}" ?`,
      confirmLabel: 'Supprimer'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.skillService.deleteSkill(skill.id).subscribe({
        next: () => {
          this.toastService.success('Compétence supprimée.');
          this.skills.update(list => list.filter(s => s.id !== skill.id));
        },
        error: () => this.toastService.error('Erreur lors de la suppression de la compétence.')
      });
    });
  }

  resetSkill(): void {
    this.editingSkillId.set(null);
    this.skillForm = this.emptySkill();
  }

  private emptySkill(): SkillFormModel {
    return {
      name: '',
      category: this.categories()[0]?.id ?? null,
      proficiency: 2,
      percentage: 50,
      icon: '',
      years_of_experience: 0,
      order: 0
    };
  }
}
