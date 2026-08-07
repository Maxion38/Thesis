import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CriteriaModel } from '../models/criteria.model';
import { StudentWithGridsModel } from '../models/students-grids-id.model';

@Injectable({
  providedIn: 'root'
})
export class AssessmentGridService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/assessment-grid`;

  getStudentsWithGrids(): Observable<StudentWithGridsModel[]> {
    return this.http.get<StudentWithGridsModel[]>(
      `${this.apiUrl}/students`,
      { withCredentials: true }
    );
  }

  getAssessmentGrid(gridId: number): Observable<CriteriaModel[]> {
    return this.http.get<CriteriaModel[]>(
      `${this.apiUrl}/${gridId}`,
      { withCredentials: true }
    );
  }
}