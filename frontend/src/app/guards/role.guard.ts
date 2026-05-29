import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {

    const allowedRoles = route.data['roles'] as string[];

    const userRole = this.authService.getFirstRole(); // TODO : handle multi role users

    if (!userRole) {
      return this.router.parseUrl('/auth/login');
    }

    if (!allowedRoles.includes(userRole)) {
      return this.router.parseUrl('/');
    }

    return true;
  }
}