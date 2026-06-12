import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { BootStrapRegisterModel } from '../models/bootstrap-register.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;;

  private user: any = null;

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
  }

  getUser() {
    return this.user;
  }

  getFirstRole() {
    return this.user?.roles[0];
  }

  clearUser() {
    this.user = null;
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