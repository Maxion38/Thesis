import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDto } from '../../users/dto/user.dto';


@Injectable({
  providedIn: 'root',
})
export class AssignmentsService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/assignments';

  getAssignedUsers(trainingCourseId: number): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(
      `${this.apiUrl}/${trainingCourseId}/assigned`
    );
  }

  getAssignableUsers(trainingCourseId: number): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(
      `${this.apiUrl}/${trainingCourseId}/assignable`
    );
  }

  assignUsers(
    trainingCourseId: number,
    userIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${trainingCourseId}/assign`,
      { userIds }
    );
  }

  unassignUsers(
    trainingCourseId: number,
    userIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${trainingCourseId}/unassign`,
      { userIds }
    );
  }
}