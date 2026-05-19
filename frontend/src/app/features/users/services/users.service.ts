import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel } from '../models/users.model';

@Injectable({
  providedIn: 'root'
})

export class UsersService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/users';

  getAll(): Observable<UserModel[]> {
    return this.http.get<UserModel[]>(
      this.apiUrl,
      { withCredentials: true }
    );
  }
}