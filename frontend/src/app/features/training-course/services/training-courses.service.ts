import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { TrainingCourseModel } from './../models/training-course.model'


@Injectable({
  providedIn: 'root'
})

export class TrainingCoursesService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/training-courses';

  getAll(): Observable<TrainingCourseModel[]> {
    return this.http.get<TrainingCourseModel[]>(this.apiUrl);
  }

  getById(id: number): Observable<TrainingCourseModel> {
    return this.http.get<TrainingCourseModel>(`${this.apiUrl}/${id}`);
  }

  create(data: { title: string }): Observable<TrainingCourseModel> {
    return this.http.post<TrainingCourseModel>(this.apiUrl, data);
  }

  update(id: number, data: Partial<TrainingCourseModel>): Observable<TrainingCourseModel> {
    return this.http.patch<TrainingCourseModel>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}