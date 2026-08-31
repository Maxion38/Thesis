import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

// L'appel de refresh lui-même passe aussi par cet intercepteur : en l'excluant
// ici on évite une boucle infinie si /auth/refresh répond 401 (token expiré/révoqué).
const isAuthEndpoint = (url: string) =>
  ['/auth/login', '/auth/refresh', '/auth/logout'].some(path => url.includes(path));

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint(req.url)) {
        return authService.refresh().pipe(
          switchMap(() => next(req)),
          catchError((refreshError) => {
            // 401 uniquement si l'utilisateur était considéré comme connecté
            // → évite une redirection en boucle lors du check initial (/me au chargement)
            if (authService.getUser()) {
              authService.clearUser();
              router.navigate(['/auth/login']);
            }
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};