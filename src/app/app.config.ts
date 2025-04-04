import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';

import {MyPreset} from './mypreset'
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {tokenInterceptor} from './core/auth/token.interceptor';
import {ConfirmationService, MessageService} from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    ConfirmationService,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme : {
        preset: MyPreset,
        options: {
          cssLayer: {
            name: 'primeng',
            order: 'tailwind, primeng'
          }
        }
      }
    })
  ]
};
