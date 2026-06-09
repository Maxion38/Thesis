import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CreateWorkModel, UpdateWorkModel, WorkModel, WorkSubmissionModel } from '../models/work.model';
import { mapWork } from '../mappers/work.mapper';

@Injectable({
  providedIn: 'root',
})
export class WorkService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/works';


  getWork(workId: number): Observable<WorkModel> {
    return this.http
      .get(`${this.apiUrl}/${workId}`, { withCredentials: true })
      .pipe(map(mapWork));
  }

  createWork(payload: CreateWorkModel): Observable<any> {
    return this.http.post(
        this.apiUrl, 
        payload,
        { withCredentials: true },
    );
  }

  updateWork(workId: number, payload: UpdateWorkModel): Observable<any> {
    return this.http.patch(
        `${this.apiUrl}/${workId}`, 
        payload,
        { withCredentials: true },
    );
  }

  submitWork(workId: number, file: File): Observable<WorkSubmissionModel> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<WorkSubmissionModel>(
      `${this.apiUrl}/${workId}/submissions`,
      formData,
      { withCredentials: true },
    );
  }

  getLatestSubmission(workId: number): Observable<WorkSubmissionModel | null> {
    return this.http.get<WorkSubmissionModel | null>(
      `${this.apiUrl}/${workId}/submissions/latest`,
      { withCredentials: true },
    );
  }

  getSubmissionFile(workId: number, submissionId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${workId}/submissions/${submissionId}/file`,
      { withCredentials: true, responseType: 'blob' },
    );
  }

  removeSubmission(workId: number, submissionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${workId}/submissions/${submissionId}`,
      { withCredentials: true },
    );
  }

  getUserSubmissions(userId: number): Observable<WorkSubmissionModel[] | null> {
    return this.http.get<WorkSubmissionModel[] | null>(
      `${this.apiUrl}/user-submissions/${userId}`,
      { withCredentials: true },
    );
  }
}