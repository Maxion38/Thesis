import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class RootRedirectGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

    canActivate(): UrlTree {

    if (!this.authService.bootstrapStatus()) {
        return this.router.parseUrl('/auth/register');
    }

    const user = this.authService.getUser();

    if (!user) {
        return this.router.parseUrl('/auth/login');
    }

    const role = this.authService.getFirstRole();

    if (role === 'COORDINATOR') {
        return this.router.parseUrl('/coordinator');
    }

    if (role === 'STUDENT') {
        return this.router.parseUrl('/student');
    }

    if (role === 'TEACHER') {
        return this.router.parseUrl('/teacher');
    }

    return this.router.parseUrl('/auth/login');
    }
}