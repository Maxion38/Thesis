import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Role } from '../../entities/role.entity';

export interface User {
  id: number;
  surname: string;
  firstname?: string;
  role: Role;
  trainingCourses?: TrainingCourse[];
}

export interface TrainingCourse {
  id: number;
  label: string;
}

@Component({
  selector: 'app-users-pool',
  templateUrl: './users-pool.component.html',
  styleUrls: ['./users-pool.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class UsersPoolComponent implements OnInit, OnChanges {

  @Input() users: User[] = [];
  @Input() title?: string;
  @Input() actionName!: string;

  @Output() selectedUsersChange = new EventEmitter<User[]>();

  filteredUsers: User[] = [];

  searchText: string = '';
  selectedRole: string = 'ALL';
  selectedCourseId: number | 'ALL' = 'ALL';

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

    this.filteredUsers = this.users
      .filter(user => {
        if (this.selectedRole !== 'ALL' && user.role !== this.selectedRole) {
          return false;
        }
        return true;
      })
      .map(user => {
        const fullName = `${user.firstname ?? ''} ${user.surname}`.toLowerCase();

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

  getRoleLabel(role: string): string {
    switch (role) {
      case 'STUDENT':
        return 'Étudiant';
      case 'TEACHER':
        return 'Enseignant';
      case 'COORDINATOR':
        return 'Coordinateur';
      default:
        return role;
    }
  }

  toggleUserSelection(user: User): void {
    if (this.selectedUsers.has(user.id)) {
      this.selectedUsers.delete(user.id);
    } else {
      this.selectedUsers.add(user.id);
    }
  }

  emitSelectedUsers(): void {
    const selected = this.users.filter(u =>
      this.selectedUsers.has(u.id)
    );

    this.selectedUsersChange.emit(selected);
    this.selectedUsers.clear();
  }
}