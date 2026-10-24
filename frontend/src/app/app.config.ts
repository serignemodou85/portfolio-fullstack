// src/app/app.config.ts
import { ApplicationConfig, ErrorHandler, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { MonitoringErrorHandler } from './core/monitoring/sentry';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: ErrorHandler, useClass: MonitoringErrorHandler },
    // Haut de page sur une nouvelle navigation, position restaurée sur "retour" :
    // sans ça, un clic dans le footer ouvre la page suivante déjà scrollée en bas.
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      // Fondu natif entre les pages (ignoré par les navigateurs qui ne le supportent pas).
      withViewTransitions()
    ),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // PWA (build de production uniquement). Enregistré une fois l'app stable
    // pour ne pas concurrencer le premier affichage.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
