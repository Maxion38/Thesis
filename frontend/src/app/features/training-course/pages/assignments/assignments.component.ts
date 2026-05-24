import { Component } from '@angular/core';
import { UsersPoolComponent } from '../../../components/user-pool/users-pool.component';
import { Role } from '../../../entities/role.entity';
import { User, TrainingCourse } from '../../../components/user-pool/users-pool.component';



@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss'],
  imports: [UsersPoolComponent],
})
export class AssignmentsComponent {
  mockTrainingCourses: TrainingCourse[] = [
    { id: 1, label: "Parcours de formation TFE Q1" },
    { id: 2, label: "Parcours de formation TFE Q2" },
    { id: 3, label: "Parcours de formation stage Q1" },
    { id: 4, label: "Parcours de formation stage Q2" },
  ];

  mockUsers1: User[] = [
    {
      id: 1,
      surname: "Johnson",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[0]]
    },
    {
      id: 2,
      surname: "Williams",
      firstname: "James",
      role: Role.COORDINATOR,
      trainingCourses: [this.mockTrainingCourses[0]]
    },
    {
      id: 3,
      surname: "Bongartz",
      firstname: "Maxime",
      role: Role.STUDENT,
      trainingCourses: [
        this.mockTrainingCourses[1],
        this.mockTrainingCourses[2]
      ]
    },
    {
      id: 4,
      surname: "Martinez",
      firstname: "Smith",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[0]]
    },
    {
      id: 5,
      surname: "Jones",
      firstname: "Williams",
      role: Role.STUDENT,
      trainingCourses: [
        this.mockTrainingCourses[0],
        this.mockTrainingCourses[3]
      ]
    },
    {
      id: 6,
      surname: "Brown",
      firstname: "Linda",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[2]]
    },
  ];

  mockUsers2: User[] = [
    {
      id: 7,
      surname: "Johnson",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[0]]
    },
    {
      id: 8,
      surname: "Williams",
      firstname: "James",
      role: Role.COORDINATOR,
      trainingCourses: [this.mockTrainingCourses[0]]
    },
    {
      id: 9,
      surname: "Smith",
      firstname: "Daniel",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[1]]
    },
    {
      id: 10,
      surname: "Bongartz",
      firstname: "Maxime",
      role: Role.STUDENT,
      trainingCourses: [
        this.mockTrainingCourses[1],
        this.mockTrainingCourses[2]
      ]
    },
    {
      id: 11,
      surname: "Thomas",
      firstname: "Jennifer",
      role: Role.TEACHER,
      trainingCourses: [
        this.mockTrainingCourses[1],
        this.mockTrainingCourses[2]
      ]
    },
    {
      id: 12,
      surname: "Smith",
      firstname: "Miller",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[2]]
    },
    {
      id: 13,
      surname: "Davis",
      firstname: "Davis",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[2]]
    },
    {
      id: 14,
      surname: "Miller",
      firstname: "George",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[2]]
    },
    {
      id: 15,
      surname: "Martinez",
      firstname: "Smith",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[0]]
    },
    {
      id: 16,
      surname: "Jones",
      firstname: "Williams",
      role: Role.STUDENT,
      trainingCourses: [
        this.mockTrainingCourses[0],
        this.mockTrainingCourses[3]
      ]
    },
    {
      id: 17,
      surname: "Smith",
      firstname: "Patricia",
      role: Role.TEACHER,
      trainingCourses: [
        this.mockTrainingCourses[0],
        this.mockTrainingCourses[3]
      ]
    },
    {
      id: 18,
      surname: "Brown",
      firstname: "Linda",
      role: Role.STUDENT,
      trainingCourses: [this.mockTrainingCourses[2]]
    },
  ];

  participantsUsers: User[] = [...this.mockUsers1];

  allOtherUsers: User[] = [...this.mockUsers2];


  handleAdd(users: User[]) {

    const idsToAdd = new Set(users.map(u => u.id));

    const movingUsers = this.allOtherUsers.filter(u => idsToAdd.has(u.id));

    this.participantsUsers = [...this.participantsUsers, ...movingUsers];

    this.allOtherUsers = this.allOtherUsers.filter(u => !idsToAdd.has(u.id));

    console.log(this.participantsUsers, this.allOtherUsers);
  }

  handleRemove(users: User[]) {

    const idsToRemove = new Set(users.map(u => u.id));

    const movingUsers = this.participantsUsers.filter(u => idsToRemove.has(u.id));

    this.allOtherUsers = [...this.allOtherUsers, ...movingUsers];

    this.participantsUsers = this.participantsUsers.filter(u => !idsToRemove.has(u.id));
  }
}