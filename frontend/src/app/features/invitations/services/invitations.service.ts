import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserToInviteModel } from '../model/user-to-invite.model';
import { ActivateAccountModel } from '../model/activateAccountModel';

@Injectable({
  providedIn: 'root'
})

export class InvitationService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/invitation';

  inviteUsers(data: UserToInviteModel[]): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(
        `${this.apiUrl}/inviteUsers`, 
        data,
        { withCredentials: true }
    );
  }

  verifyActivationLink(token: string): Observable<{ valid: boolean; email: string }> {
    return this.http.get<{ valid: boolean; email: string }>(
      `${this.apiUrl}/verifyActivationLink`,
      {
        params: { token }
      }
    );
  }

  activateAccount(data: ActivateAccountModel): Observable<{ message: string}> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/activateAccount`, data);
  }
}