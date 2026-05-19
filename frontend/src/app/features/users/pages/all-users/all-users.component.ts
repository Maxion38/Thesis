import { ChangeDetectorRef , Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../entities/role.entity';
import { UsersService } from '../../services/users.service';
import { UserModel } from '../../models/users.model';

export interface user {
  surname: string;
  firstname?: string;
  role: Role;
  trainingCourses?: trainingCourse[];
}

export interface trainingCourse {
  id: number;
  label: string;
}

@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class AllUsersComponent implements OnInit {
  users: UserModel[] = [];
  trainingCourses: trainingCourse[] = [];

  mockTrainingCourses: trainingCourse[] = [
    { id: 1, label: "Parcours de formation TFE Q1" },
    { id: 2, label: "Parcours de formation TFE Q2" },
    { id: 3, label: "Parcours de formation stage Q1" },
    { id: 4, label: "Parcours de formation stage Q2" },
  ];

  mockUsers: user[] = [
    { surname: "Johnson", role: Role.STUDENT, trainingCourses: [this.trainingCourses[0]] },
    { surname: "Williams", firstname: "James", role: Role.COORDINATOR, trainingCourses: [this.trainingCourses[0]] },
    { surname: "Smith", firstname: "Daniel", role: Role.STUDENT, trainingCourses: [this.trainingCourses[1]] },
    { surname: "Bongartz", firstname: "Maxime", role: Role.STUDENT, trainingCourses: [this.trainingCourses[1], this.trainingCourses[2]] },
    { surname: "Thomas", firstname: "Jennifer", role: Role.TEACHER, trainingCourses: [this.trainingCourses[1], this.trainingCourses[2]] },
    { surname: "Smith", firstname: "Miller", role: Role.STUDENT, trainingCourses: [this.trainingCourses[2]] },
    { surname: "Davis", firstname: "Davis", role: Role.STUDENT, trainingCourses: [this.trainingCourses[2]] },
    { surname: "Miller", firstname: "George", role: Role.STUDENT, trainingCourses: [this.trainingCourses[2]] },
    { surname: "Martinez", firstname: "Smith", role: Role.STUDENT, trainingCourses: [this.trainingCourses[0]] },
    { surname: "Jones", firstname: "Williams", role: Role.STUDENT, trainingCourses: [this.trainingCourses[0], this.trainingCourses[3]] },
    { surname: "Smith", firstname: "Patricia", role: Role.TEACHER, trainingCourses: [this.trainingCourses[0], this.trainingCourses[3]] },
    { surname: "Brown", firstname: "Linda", role: Role.STUDENT, trainingCourses: [this.trainingCourses[2]] },
  ];

  filteredUsers: UserModel[] = [];

  searchText: string = '';
  selectedRole: string = 'ALL';
  selectedCourseId: number | 'ALL' = 'ALL';

  constructor (
    private changeDetectorRef: ChangeDetectorRef,
    private usersService : UsersService,
  ) {}

  ngOnInit(): void {
    this.filteredUsers = [...this.users];

    console.log("yeah");
    this.usersService.getAll().subscribe ({
      next: (users) => {
        this.users = users;
        this.applyFilters();
        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users', err);
      }
    })
    console.log("yeah2");
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    const result = this.users
      .filter(user => {

        // ROLE FILTER
        if (this.selectedRole !== 'ALL' && user.role !== this.selectedRole) {
          return false;
        }

        // COURSE FILTER
        // if (this.selectedCourseId !== 'ALL') {
        //   const hasCourse = user.trainingCourses?.some(
        //     c => c.id === this.selectedCourseId
        //   );
        //   if (!hasCourse) return false;
        // }

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

    this.filteredUsers = result;
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
}