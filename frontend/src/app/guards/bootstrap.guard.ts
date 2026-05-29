import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../features/auth/services/auth.service';
import { map, catchError, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class BootstrapGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {

    const isRegisterRoute = route.routeConfig?.path === 'register';

    return this.authService.bootstrapStatus().pipe(
      map((bootstrapNotDone: boolean) => {

        // bootstrap allready done → block register
        if (!bootstrapNotDone && (isRegisterRoute)) {
          return this.router.parseUrl('/auth/login');
        }

        // bootstrap not done allready → block login
        if (bootstrapNotDone && route.routeConfig?.path === 'login') {
          return this.router.parseUrl('/auth/register');
        }

        return true;
      }),

      catchError(() => {
        // fallback
        return of(this.router.parseUrl('/auth/login'));
      })
    );
  }
}