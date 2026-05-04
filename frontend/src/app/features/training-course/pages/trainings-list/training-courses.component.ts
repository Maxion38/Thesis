import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainingCourseCardComponent } from '../../components/training-course-card/training-course-card.component'
import { TrainingCoursesService } from '../../services/training-courses.service';
import { TrainingCourseModel } from './../../models/training-course.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-training-courses',
  templateUrl: './training-courses.component.html',
  styleUrls: ['./training-courses.component.scss'],
  imports: [CommonModule, TrainingCourseCardComponent],
})

export class TrainingCoursesComponent implements OnInit {
  courses$!: Observable<TrainingCourseModel[]>;

  constructor(private trainingCoursesService: TrainingCoursesService) {}

  ngOnInit(): void {
    this.courses$ = this.trainingCoursesService.getAll();
  }
}


  // courses: TrainingCourseCard[] = [
  //   { title: 'Parcours de formation TFE Q1', usersNumber: 9, teachersNumber: 9, id: 1 },
  //   { title: 'Parcours de formation TFE Q2', startDate: new Date('2026-04-27'), endDate: new Date('2026-04-27'), usersNumber: 54, teachersNumber: 10, id: 2 },
  //   { title: "Stage technologie de l'informatique le titre est super long pour tester", startDate: new Date('2026-04-27'), endDate: new Date('2026-04-27'), usersNumber: 36, teachersNumber: 10, id: 3 },
  //   { id: 4, title: "Hey I am currently hardcoded", usersNumber: 0, teachersNumber: 0},
  // ];