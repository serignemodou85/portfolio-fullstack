// src/app/core/guards/auth-guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessToken = authService.getAccessToken();

  if (!accessToken) {
    router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const currentUser = authService.getCurrentUserSnapshot();
  if (currentUser) {
    const isAdmin = !!(currentUser.is_staff || currentUser.is_superuser);
    if (isAdmin) {
      return true;
    }
    router.navigate(['/']);
    return false;
  }

  return authService.fetchCurrentUser().pipe(
    map((user) => {
      const isAdmin = !!(user.is_staff || user.is_superuser);
      if (isAdmin) {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
    catchError(() => {
      authService.logout();
      router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
