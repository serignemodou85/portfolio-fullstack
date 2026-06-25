import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError, switchMap, throwError } from 'rxjs';

function isPublicReadRequest(url: string, method: string): boolean {
  if (method !== 'GET') return false;
  return (
    url.includes('/api/projects') ||
    url.includes('/api/experiences') ||
    url.includes('/api/skills') ||
    url.includes('/api/skill-categories') ||
    url.includes('/api/blog/articles') ||
    url.includes('/api/blog/categories') ||
    url.includes('/api/blog/tags') ||
    url.includes('/api/users/public_profile')
  );
}

function addAuth(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isAuthEndpoint = req.url.includes('/auth/');
  const publicRead = isPublicReadRequest(req.url, req.method);

  // Ajouter credentials sur les endpoints auth (login, refresh, logout transportent le cookie)
  let outgoing = isAuthEndpoint ? req.clone({ withCredentials: true }) : req;
  if (!publicRead) {
    outgoing = addAuth(outgoing, authService.getAccessToken());
  }

  const redirectToLogin = () => {
    const current = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/admin/login?returnUrl=${encodeURIComponent(current)}`);
  };

  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint && !publicRead) {
        return authService.refreshToken().pipe(
          switchMap(() => next(addAuth(outgoing, authService.getAccessToken()))),
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
