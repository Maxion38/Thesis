import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ProjectWithGridsModel } from '../models/project-with-grids.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/assessment-grid`;

  getProjectsWithGrids(): Observable<ProjectWithGridsModel[]> {
    return this.http.get<ProjectWithGridsModel[]>(
      `${this.apiUrl}/projects`,
      { withCredentials: true }
    );
  }
}
