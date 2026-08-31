import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { BootStrapRegisterModel } from '../models/bootstrap-register.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;;

  private user: any = null;
  // Multicasts a single in-flight /auth/refresh call so several requests that
  // 401 at the same time (access token just expired) trigger one rotation
  // instead of racing each other and tripping reuse detection.
  private refreshInProgress$: Observable<any> | null = null;
  // Rôle sous lequel l'utilisateur navigue actuellement. Pour un compte à
  // plusieurs rôles (ex: COORDINATOR + TEACHER), c'est ce champ - et non plus
  // uniquement le premier rôle en DB - qui pilote la navbar/menu/gardes de
  // route, pour que le bouton de switch change la vue sans reconnexion.
  private activeRole: any = null;

  bootstrapStatus(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/bootstrap-status`);
  }

  bootstrapRegister(data: BootStrapRegisterModel): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/bootstrap-register`, data);
  }

  checkAuth() {
    return this.http.get(
      `${this.apiUrl}/me`,
      { withCredentials: true });
  }

  setUser(user: any) {
    this.user = user;
    this.activeRole = user?.roles?.[0] ?? null;
  }

  getUser() {
    return this.user;
  }

  getRoles(): string[] {
    return this.user?.roles ?? [];
  }

  getFirstRole() {
    return this.activeRole;
  }

  setActiveRole(role: string) {
    if (this.user?.roles?.includes(role)) {
      this.activeRole = role;
    }
  }

  clearUser() {
    this.user = null;
    this.activeRole = null;
  }

  loadUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`, {
      withCredentials: true
    }).pipe(
      tap(user => this.setUser(user))
    );
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      data,
      { withCredentials: true }
    ).pipe(
      switchMap(() => this.loadUser())
    );
  }

  refresh(): Observable<any> {
    if (!this.refreshInProgress$) {
      this.refreshInProgress$ = this.http
        .post(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
        .pipe(
          tap(() => { this.refreshInProgress$ = null; }),
          catchError(err => {
            this.refreshInProgress$ = null;
            return throwError(() => err);
          }),
          shareReplay(1)
        );
    }

    return this.refreshInProgress$;
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(
        `${this.apiUrl}/logout`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap(() => this.clearUser())
      );
  }
}