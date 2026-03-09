// src/app/core/models/skill.model.ts
export interface SkillCategory {
  id?: number;
  name: string;
  icon?: string;
  order: number;
  skills_count?: number;
}

export interface SkillItem {
  id: number;
  name: string;
  category: number;
  category_name?: string;
  proficiency: 1 | 2 | 3 | 4;
  proficiency_display?: string;
  percentage: number;
  icon?: string;
  years_of_experience: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface SkillCategoryWithSkills {
  id: number;
  name: string;
  icon?: string;
  order: number;
  skills: SkillItem[];
}
