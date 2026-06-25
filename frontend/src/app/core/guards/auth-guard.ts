import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const current = authService.getCurrentUserSnapshot();
  if (current) {
    if (current.is_staff || current.is_superuser) return true;
    router.navigate(['/']);
    return false;
  }

  // fetchCurrentUser() → 401 → intercepteur tente le refresh via cookie → retry automatique
  return authService.fetchCurrentUser().pipe(
    map(user => {
      if (user.is_staff || user.is_superuser) return true;
      router.navigate(['/']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
