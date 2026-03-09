// src/app/core/models/article.model.ts
export interface ArticleAuthor {
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

export interface ArticleTag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleBase {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  views_count: number;
  reading_time: number;
  published_at?: string;
  created_at: string;
  author?: ArticleAuthor;
}

export interface ArticleList extends ArticleBase {
  category_name?: string;
  tags: ArticleTag[];
}

export interface ArticleDetail extends ArticleBase {
  content: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
  } | null;
  tags: ArticleTag[];
}
