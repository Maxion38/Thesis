import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvitationService } from '../../services/invitations.service'

export interface UserToInvite {
  id: number,
  email: string,
  role: string,
}

@Component({
  selector: 'app-invitations',
  templateUrl: './invitations.component.html',
  styleUrls: ['./invitations.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class InvitationsComponent implements OnInit {

  inviteActionsForm!: FormGroup;

  usersToInvite: UserToInvite[] = [];

  constructor(
    private invitationService: InvitationService,  
  ) {}

  ngOnInit(): void {
    this.inviteActionsForm = new FormGroup({
      text: new FormControl('', [
        Validators.required
      ]),
      role: new FormControl('STUDENT', [
        Validators.required
      ])
    });
  }

  add(): void {
    if (this.inviteActionsForm.invalid) {
      return;
    }

    const formValue = this.inviteActionsForm.value;

    const role = formValue.role;

    let nextId = this.usersToInvite.length + 1;

    const users = formValue.text
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0)
      .map((email: string) => ({
        id: nextId++,
        email,
        role
      }));

    this.usersToInvite.push(...users);


    this.inviteActionsForm.reset({
      text: '',
      role: 'STUDENT'
    });
  }

  onRoleChange(userId: number, role: string): void {
    const user = this.usersToInvite.find(u => u.id === userId);
    if (user) {
      user.role = role;
    }
  }

  removeUser(userId: number): void {
    this.usersToInvite = this.usersToInvite.filter(u => u.id !== userId);
  }

  sendInvitations(): void {
    if (!this.usersToInvite.length) return;

    console.log(this.usersToInvite);

    const payload = this.usersToInvite.map(({ email, role }) => ({
      email,
      role,
    }));

    this.invitationService.inviteUsers(payload).subscribe({
      next: (res) => {
        console.log(res.message, res.count); // TODO: replace by dynamic span for user response

        this.usersToInvite = [];
      },
      error: (err) => {
        console.error('Error sending invitations', err); // TODO: replace by dynamic span for user response
      },
    });
  }
}
