import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrainingCourseWithStats, TrainingCourseStatus, getTrainingCourseStatus } from './../../models/training-course.model';

const STATUS_COLORS: Record<TrainingCourseStatus, string> = {
  archived: '#8B5E3C',
  active: '#2ECC71',
  planned: '#00A3DE',
  none: '#C7C7C7',
};

@Component({
  selector: 'app-training-course-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './training-course-card.component.html',
  styleUrls: ['./training-course-card.component.scss']
})

export class TrainingCourseCardComponent {
  @Input({ required: true }) course!: TrainingCourseWithStats;

  get status(): TrainingCourseStatus {
    return getTrainingCourseStatus(this.course);
  }

  get indicatorColor(): string {
    return STATUS_COLORS[this.status];
  }
}