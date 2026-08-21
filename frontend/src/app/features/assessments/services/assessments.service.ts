import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CriteriaModel } from '../models/criteria.model';
import { ProjectWithGridsModel } from '../../projects/models/project-with-grids.model';
import { EvaluationModel, SetCriteriaNoteResultModel } from '../models/evaluation.model';
import { CriteriaDiscussionModel } from '../models/discussion.model';
import { GridContextModel } from '../models/grid-context.model';

@Injectable({
  providedIn: 'root'
})
export class AssessmentGridService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/assessment-grid`;

  getProjectsWithGrids(): Observable<ProjectWithGridsModel[]> {
    return this.http.get<ProjectWithGridsModel[]>(
      `${this.apiUrl}/projects`,
      { withCredentials: true }
    );
  }

  getAssessmentGrid(gridId: number): Observable<CriteriaModel[]> {
    return this.http.get<CriteriaModel[]>(
      `${this.apiUrl}/${gridId}`,
      { withCredentials: true }
    );
  }

  getGridEvaluations(gridId: number, projectId: number): Observable<EvaluationModel[]> {
    return this.http.get<EvaluationModel[]>(
      `${this.apiUrl}/${gridId}/evaluations`,
      { params: { projectId }, withCredentials: true }
    );
  }

  setCriteriaNote(criteriaId: number, projectId: number, note: number | null): Observable<SetCriteriaNoteResultModel> {
    return this.http.patch<SetCriteriaNoteResultModel>(
      `${this.apiUrl}/criteria/${criteriaId}/note`,
      { projectId, note },
      { withCredentials: true }
    );
  }

  setCriteriaFeedback(criteriaId: number, projectId: number, commentFeedback: string): Observable<SetCriteriaNoteResultModel> {
    return this.http.patch<SetCriteriaNoteResultModel>(
      `${this.apiUrl}/criteria/${criteriaId}/feedback`,
      { projectId, commentFeedback },
      { withCredentials: true }
    );
  }

  getCriteriaDiscussions(criteriaId: number, projectId: number): Observable<CriteriaDiscussionModel[]> {
    return this.http.get<CriteriaDiscussionModel[]>(
      `${this.apiUrl}/criteria/${criteriaId}/discussions`,
      { params: { projectId }, withCredentials: true }
    );
  }

  postCriteriaDiscussion(criteriaId: number, projectId: number, comment: string): Observable<CriteriaDiscussionModel> {
    return this.http.post<CriteriaDiscussionModel>(
      `${this.apiUrl}/criteria/${criteriaId}/discussions`,
      { projectId, comment },
      { withCredentials: true }
    );
  }

  getGridContext(gridId: number, projectId: number): Observable<GridContextModel> {
    return this.http.get<GridContextModel>(
      `${this.apiUrl}/${gridId}/context`,
      { params: { projectId }, withCredentials: true }
    );
  }
}