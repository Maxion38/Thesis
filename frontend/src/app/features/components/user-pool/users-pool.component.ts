import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { UserModel } from '../../users/models/users.model';
import { RoleType } from '../../entities/role.entity';

@Component({
  selector: 'app-users-pool',
  templateUrl: './users-pool.component.html',
  styleUrls: ['./users-pool.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class UsersPoolComponent implements OnInit, OnChanges {

  @Input() users: UserModel[] = [];
  @Input() title?: string;
  @Input() actionName!: string;

  @Output() selectedUsersChange = new EventEmitter<UserModel[]>();

  filteredUsers: UserModel[] = [];

  searchText = '';
  selectedRole: string = 'ALL';
  selectedUsers = new Set<number>();

  ngOnInit(): void {
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    const filtered = this.users.filter(user => {
      const role = user.roles?.[0];

      if (this.selectedRole !== 'ALL' && role !== this.selectedRole) {
        return false;
      }

      return true;
    });

    this.filteredUsers = filtered
      .map(user => {
        const fullName =
          `${user.firstname ?? ''} ${user.surname}`.toLowerCase();

        let score = 0;

        if (search) {
          if (fullName === search) score += 100;
          else if (fullName.startsWith(search)) score += 50;
          else if (fullName.includes(search)) score += 10;

          if (user.surname.toLowerCase().includes(search)) score += 5;
          if (user.firstname?.toLowerCase().includes(search)) score += 5;
        }

        return { user, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(x => x.user);
  }

  getRoleLabel(role?: RoleType): string {
    switch (role) {
      case 'STUDENT':
        return 'Étudiant';
      case 'TEACHER':
        return 'Enseignant';
      case 'COORDINATOR':
        return 'Coordinateur';
      case 'GUEST':
        return 'Invité';
      default:
        return role ?? '';
    }
  }

  toggleUserSelection(user: UserModel): void {
    const id = user.id;

    if (this.selectedUsers.has(id)) {
      this.selectedUsers.delete(id);
    } else {
      this.selectedUsers.add(id);
    }
  }

  emitSelectedUsers(): void {
    const selected = this.filteredUsers.filter(user =>
      this.selectedUsers.has(user.id)
    );

    this.selectedUsersChange.emit(selected);
    this.selectedUsers.clear();
  }
}