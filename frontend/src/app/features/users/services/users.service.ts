import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel } from '../models/users.model';
import { ProjectModel } from '../models/project.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class UsersService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/users`;
  

  getAll(): Observable<UserModel[]> {
    return this.http.get<UserModel[]>(
      this.apiUrl,
      { withCredentials: true }
    );
  }

  getMyFirstProject(): Observable<ProjectModel> {
    return this.http.get<ProjectModel>(
      `${this.apiUrl}/my-first-project`,
      { withCredentials: true }
    )
  }
}