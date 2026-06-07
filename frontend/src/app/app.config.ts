import { provideAppInitializer, ApplicationConfig, provideBrowserGlobalErrorListeners, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';

import { AuthService } from './features/auth/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNativeDateAdapter(),

    provideAppInitializer(() => {
      const authService = inject(AuthService);

      return firstValueFrom(authService.checkAuth())
        .then(user => authService.setUser(user))
        .catch(() => authService.clearUser());
    }),
  ]
};