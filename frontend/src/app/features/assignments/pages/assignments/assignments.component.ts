import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UsersPoolComponent } from '../../../components/user-pool/users-pool.component';
import { AssignmentsService } from '../../services/assignments.service';

import { UserModel } from '../../../users/models/users.model';
import { toUserModel } from '../../mappers/assignments.mapper';

@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss'],
  imports: [UsersPoolComponent],
})
export class AssignmentsComponent implements OnInit {

  participantsUsers: UserModel[] = [];
  assignableUsers: UserModel[] = [];

  trainingCourseId!: number;

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private assignmentsService: AssignmentsService,
  ) {}

  ngOnInit(): void {
    this.trainingCourseId = Number(
      this.route.parent?.snapshot.paramMap.get('trainingCourseId')
    );

    this.loadData();
  }

  // -----------------------------
  // DATA
  // -----------------------------

  private loadData(): void {
    this.assignmentsService
      .getAssignedUsers(this.trainingCourseId)
      .subscribe((users: any[]) => {
        this.participantsUsers = users.map(toUserModel);
        this.cdr.detectChanges();
      });

    this.assignmentsService
      .getAssignableUsers(this.trainingCourseId)
      .subscribe((users: any[]) => {
        this.assignableUsers = users.map(toUserModel);
        this.cdr.detectChanges();
      });
  }

  // -----------------------------
  // ACTIONS
  // -----------------------------

  handleAdd(users: UserModel[]) {
    const userIds = [...new Set(users.map(u => u.id))];

    const movingUsers = this.assignableUsers.filter(u =>
      userIds.includes(u.id)
    );

    this.participantsUsers = [
      ...this.participantsUsers,
      ...movingUsers
    ];

    this.assignableUsers = this.assignableUsers.filter(
      u => !userIds.includes(u.id)
    );

    this.assignmentsService
      .assignUsers(this.trainingCourseId, userIds)
      .subscribe({
        error: () => {
          this.assignableUsers = [
            ...this.assignableUsers,
            ...movingUsers
          ];

          this.participantsUsers = this.participantsUsers.filter(
            u => !userIds.includes(u.id)
          );
        }
      });
  }

  handleRemove(users: UserModel[]) {
    const userIds = [...new Set(users.map(u => u.id))];

    const movingUsers = this.participantsUsers.filter(u =>
      userIds.includes(u.id)
    );

    this.assignableUsers = [
      ...this.assignableUsers,
      ...movingUsers
    ];

    this.participantsUsers = this.participantsUsers.filter(
      u => !userIds.includes(u.id)
    );

    this.assignmentsService
      .unassignUsers(this.trainingCourseId, userIds)
      .subscribe({
        error: () => {
          this.participantsUsers = [
            ...this.participantsUsers,
            ...movingUsers
          ];

          this.assignableUsers = this.assignableUsers.filter(
            u => !userIds.includes(u.id)
          );
        }
      });
  }
}