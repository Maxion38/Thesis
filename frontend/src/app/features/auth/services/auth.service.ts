import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BootStrapRegisterModel } from '../models/bootstrap-register.model';
// import { ActivateAccountModel } from '../models/activateAccountModel';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/auth';

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

  login(data: {email: string, password: string}): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/login`, 
      data,
      { withCredentials: true }
    );
  }

  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/logout`, 
      {},
      { withCredentials: true }
    );
  }
}