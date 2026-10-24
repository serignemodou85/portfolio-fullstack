import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type SentryModule = typeof import('@sentry/angular');

let sentry: SentryModule | null = null;

/**
 * Charge et initialise Sentry seulement si un DSN est configuré (environment.sentryDsn).
 * Import dynamique : sans DSN, le SDK n'est jamais téléchargé par le navigateur.
 */
export async function initMonitoring(): Promise<void> {
  if (!environment.sentryDsn) {
    return;
  }
  sentry = await import('@sentry/angular');
  sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    tracesSampleRate: 0.1,
  });
}

/** Garde le comportement Angular (log console) et transmet l'erreur à Sentry s'il est actif. */
@Injectable()
export class MonitoringErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    super.handleError(error);
    sentry?.captureException(error);
  }
}
