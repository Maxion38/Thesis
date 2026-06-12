import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDto } from '../../users/dto/user.dto';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class AssignmentsService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/assignments`;

  getAssignedUsers(trainingCourseId: number): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(
      `${this.apiUrl}/${trainingCourseId}/assigned`,
      { withCredentials: true }
    );
  }

  getAssignableUsers(trainingCourseId: number): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(
      `${this.apiUrl}/${trainingCourseId}/assignable`,
      { withCredentials: true }
    );
  }

  assignUsers(
    trainingCourseId: number,
    userIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${trainingCourseId}/assign`,
      { userIds },
      { withCredentials: true }
    );
  }

  unassignUsers(
    trainingCourseId: number,
    userIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${trainingCourseId}/unassign`,
      { userIds },
      { withCredentials: true }
    );
  }
}