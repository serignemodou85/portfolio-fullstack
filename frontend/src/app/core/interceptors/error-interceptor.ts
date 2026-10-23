import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { LanguageService } from '../services/language.service';

/**
 * Remonte à l'utilisateur les pannes qu'aucun écran ne sait expliquer :
 * perte réseau, erreur serveur, accès refusé. Les 401 sont gérés par authInterceptor,
 * les 4xx métier (validation...) par chaque écran.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const lang = inject(LanguageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        toast.error(lang.t('error.network'));
      } else if (error.status >= 500) {
        toast.error(lang.t('error.server'));
      } else if (error.status === 403) {
        toast.warning(lang.t('error.forbidden'));
      }
      return throwError(() => error);
    })
  );
};
