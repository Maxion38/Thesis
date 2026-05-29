import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrainingCourseModel, TrainingCourseWithStats } from './../models/training-course.model'
import { ModuleModel } from '../../modules-coordinator/models/module.model';


@Injectable({
  providedIn: 'root'
})

export class TrainingCoursesService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/training-courses';

  getAll(): Observable<TrainingCourseModel[]> {
    return this.http.get<TrainingCourseModel[]>(
      this.apiUrl,
      { withCredentials: true }
    );
  }

  getAllWithDetails(): Observable<TrainingCourseWithStats[]> {
    return this.http.get<TrainingCourseWithStats[]>(
      `${this.apiUrl}/details`,
      { withCredentials: true }
    );
  }

  getModulesForTrainingCourse(trainingCourseId: number): Observable<ModuleModel[]> {
    return this.http.get<ModuleModel[]>(
      `${this.apiUrl}/${trainingCourseId}/modules`,
      { withCredentials: true }
    );
  }

  getById(id: number): Observable<TrainingCourseModel> {
    return this.http.get<TrainingCourseModel>(
      `${this.apiUrl}/${id}`,
      { withCredentials: true }
    );
  }

  create(data: { name: string }): Observable<TrainingCourseModel> {
    return this.http.post<TrainingCourseModel>(
      this.apiUrl, 
      data,
      { withCredentials: true }
    );
  }

  update(id: number, data: Partial<TrainingCourseModel>): Observable<TrainingCourseModel> {
    return this.http.patch<TrainingCourseModel>(
      `${this.apiUrl}/${id}`, 
      data,
      { withCredentials: true }
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { withCredentials: true }
    );
  }

  getUsersAssignedToTrainingCourse(
    trainingCourseId: number,
  ) : Observable<any> {
    return this.http.get(
      `${this.apiUrl}/${trainingCourseId}/assigned-users`,
      { withCredentials: true }
    )
  }

  assignUsersToTrainingCourse(
    trainingCourseId: number,
    userIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${trainingCourseId}/assign-users`,
      { userIds },
      { withCredentials: true }
    );
  }

  removeUsersFromTrainingCourse(
    trainingCourseId: number,
    userIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${trainingCourseId}/unassign-users`,
      { userIds },
      { withCredentials: true }
    );
  }
}