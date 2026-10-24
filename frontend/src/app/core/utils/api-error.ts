import { HttpErrorResponse } from '@angular/common/http';

/**
 * Premier message lisible d'une erreur DRF : `detail`, `non_field_errors`,
 * puis la première erreur de champ ; sinon le message de repli.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const body = (err as HttpErrorResponse | undefined)?.error;
  if (!body || typeof body !== 'object') {
    return fallback;
  }
  if (typeof body.detail === 'string') {
    return body.detail;
  }
  for (const value of [body.non_field_errors, ...Object.values(body)]) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return fallback;
}
