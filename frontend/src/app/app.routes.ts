// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { Home } from './features/home/home/home';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Home
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/project-list/project-list').then(m => m.ProjectList)
  },
  {
    path: 'projects/:slug',
    loadComponent: () => import('./features/projects/project-detail/project-detail').then(m => m.ProjectDetail)
  },
  {
    path: 'experience',
    loadComponent: () => import('./features/experience/experience').then(m => m.Experience)
  },
  {
    path: 'skills',
    loadComponent: () => import('./features/skills/skills').then(m => m.Skills)
  },
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/article-list/article-list').then(m => m.ArticleList)
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./features/blog/article-detail/article-detail').then(m => m.ArticleDetail)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact-form/contact-form').then(m => m.ContactForm)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/login/login').then(m => m.Login)
  },
  {
    path: 'admin/reset-password',
    loadComponent: () => import('./features/admin/password-reset-request/password-reset-request').then(m => m.PasswordResetRequest)
  },
  {
    path: 'admin/reset-password/confirm',
    loadComponent: () => import('./features/admin/password-reset-confirm/password-reset-confirm').then(m => m.PasswordResetConfirm)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./features/admin/project-form/project-form').then(m => m.ProjectForm)
      },
      {
        path: 'projects/edit/:slug',
        loadComponent: () => import('./features/admin/project-form/project-form').then(m => m.ProjectForm)
      },
      {
        path: 'projects/archives',
        loadComponent: () => import('./features/admin/project-archives/project-archives').then(m => m.ProjectArchives)
      },
      {
        path: 'experiences',
        loadComponent: () => import('./features/admin/experience-admin/experience-admin').then(m => m.ExperienceAdmin)
      },
      {
        path: 'skills',
        loadComponent: () => import('./features/admin/skills-admin/skills-admin').then(m => m.SkillsAdmin)
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/admin/blog-admin/blog-admin').then(m => m.BlogAdmin)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
