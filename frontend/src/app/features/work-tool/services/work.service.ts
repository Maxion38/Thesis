import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CreateWorkModel, UpdateWorkModel, WorkModel } from '../models/work.model';
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
}