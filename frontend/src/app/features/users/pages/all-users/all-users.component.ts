import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.scss'],
  imports: [CommonModule, RouterModule],
})

export class AllUsersComponent implements OnInit {
  // courses$!: Observable<TrainingCourseModel[]>;

  constructor(
    // private trainingCoursesService: TrainingCoursesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // this.courses$ = this.trainingCoursesService.getAll();
  }
}