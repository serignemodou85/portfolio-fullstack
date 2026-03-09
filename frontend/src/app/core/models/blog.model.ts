// src/app/core/models/blog.model.ts
export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}
