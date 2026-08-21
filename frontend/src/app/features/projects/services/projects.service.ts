import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ProjectWithGridsModel } from '../models/project-with-grids.model';
import { ProjectOverviewModuleModel } from '../models/project-overview.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/assessment-grid`;
  private modulesApiUrl = `${environment.apiUrl}/modules`;

  getProjectsWithGrids(trainingCourseId?: number, rapporteur?: boolean): Observable<ProjectWithGridsModel[]> {
    const params: Record<string, string | number> = {};
    if (trainingCourseId) params['trainingCourseId'] = trainingCourseId;
    if (rapporteur) params['rapporteur'] = 'true';

    return this.http.get<ProjectWithGridsModel[]>(
      `${this.apiUrl}/projects`,
      {
        withCredentials: true,
        params,
      }
    );
  }

  getProjectOverview(projectId: number): Observable<ProjectOverviewModuleModel[]> {
    return this.http.get<ProjectOverviewModuleModel[]>(
      `${this.modulesApiUrl}/projects/${projectId}/overview`,
      { withCredentials: true }
    );
  }
}
