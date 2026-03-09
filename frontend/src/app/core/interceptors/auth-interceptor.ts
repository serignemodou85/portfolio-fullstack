// src/app/core/interceptors/auth-interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError, switchMap, throwError } from 'rxjs';

function isPublicReadRequest(url: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }

  return (
    url.includes('/api/projects') ||
    url.includes('/api/experiences') ||
    url.includes('/api/skills') ||
    url.includes('/api/skill-categories') ||
    url.includes('/api/blog/articles') ||
    url.includes('/api/blog/categories') ||
    url.includes('/api/blog/tags')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const publicRead = isPublicReadRequest(req.url, req.method);

  const redirectToLogin = () => {
    const current = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/admin/login?returnUrl=${encodeURIComponent(current)}`);
  };

  if (token && !publicRead) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/') && !publicRead) {
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          authService.logout();
          redirectToLogin();
          return throwError(() => error);
        }
        return authService.refreshToken().pipe(
          switchMap(() => {
            const newToken = authService.getAccessToken();
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(clonedReq);
          }),
          catchError((refreshError: HttpErrorResponse) => {
            if (refreshError?.status === 401 || refreshError?.status === 403) {
              authService.logout();
              redirectToLogin();
            }
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
