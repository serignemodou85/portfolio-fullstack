// src/app/core/models/experience.model.ts
export interface ExperienceItem {
  id: number;
  type: 'work' | 'education' | 'certification';
  title: string;
  company: string;
  location?: string | null;
  description: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  company_logo?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}
