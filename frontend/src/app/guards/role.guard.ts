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

    const userRoles = this.authService.getRoles();

    if (!userRoles.length) {
      return this.router.parseUrl('/auth/login');
    }

    if (!allowedRoles.some(role => userRoles.includes(role))) {
      return this.router.parseUrl('/');
    }

    // La section est autorisée pour ce compte : elle devient le rôle actif,
    // pour que le reste de l'UI (navbar, menu, pages) suive la navigation
    // même si l'utilisateur a atterri ici via un lien direct plutôt que via
    // le bouton de switch.
    const matchedRole = allowedRoles.find(role => userRoles.includes(role));
    if (matchedRole) {
      this.authService.setActiveRole(matchedRole);
    }

    return true;
  }
}