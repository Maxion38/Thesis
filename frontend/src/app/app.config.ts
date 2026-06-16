import { provideAppInitializer, ApplicationConfig, provideBrowserGlobalErrorListeners, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { AuthService } from './features/auth/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'fr' },
    provideAppInitializer(() => {
      const authService = inject(AuthService);

      return firstValueFrom(authService.checkAuth())
        .then(user => authService.setUser(user))
        .catch(() => authService.clearUser());
    }),
  ]
};