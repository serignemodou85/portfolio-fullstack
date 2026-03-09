// src/app/core/models/project.model.ts
export interface ProjectAuthor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
  profile_picture?: string;
  location?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
}

export interface ProjectBase {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  technologies: string;
  status: 'in_progress' | 'completed' | 'archived';
  is_featured?: boolean;
  start_date?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: ProjectAuthor;
  views?: number;
}

export interface ProjectList extends ProjectBase {}

export interface ProjectDetail extends ProjectBase {
  full_description?: string;
  image_1?: string;
  image_2?: string;
  image_3?: string;
  github_url?: string;
  live_url?: string;
  end_date?: string;
  order?: number;
  updated_at?: string;
}
