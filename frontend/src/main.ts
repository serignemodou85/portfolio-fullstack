// src/main.ts
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { initMonitoring } from './app/core/monitoring/sentry';

// Le monitoring ne doit jamais retarder ni bloquer l'affichage.
initMonitoring().catch(() => {});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
