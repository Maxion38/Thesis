import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateWorkModel, UpdateWorkModel } from '../models/work.model';

@Injectable({
  providedIn: 'root',
})
export class WorkService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/works';


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