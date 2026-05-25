import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TrainingCoursesService } from '../../services/training-courses.service';

type PlanningStatus = 'inactive' | 'planned' | 'active';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule
  ],
})
export class PlanningComponent implements OnInit {
  startDate = new FormControl<Date | null>(null);
  endDate = new FormControl<Date | null>(null);
  today: Date = new Date(new Date().setHours(0, 0, 0, 0));
  trainingCourseId!: number;

  constructor(
    private route: ActivatedRoute,
    private trainingCoursesService: TrainingCoursesService,
  ) {}

  ngOnInit(): void {
    this.trainingCourseId = Number(this.route.parent?.snapshot.paramMap.get('trainingCourseId'));

    this.trainingCoursesService.getById(this.trainingCourseId).subscribe(course => {
      this.startDate.setValue(course.startDate ? new Date(course.startDate) : null);
      this.endDate.setValue(course.endDate ? new Date(course.endDate) : null);
    });

    this.startDate.valueChanges.subscribe(() => this.save());
    this.endDate.valueChanges.subscribe(() => this.save());
  }

  get status(): PlanningStatus {
    const now = new Date();
    const start = this.startDate.value;
    const end = this.endDate.value;

    if (!start || !end) return 'inactive';

    if (now < start) return 'planned';
    if (now >= start && now <= end) return 'active';

    return 'planned';
  }

  get title(): string {
    switch (this.status) {
      case 'inactive':
        return 'Ce parcours de formation est inactif';
      case 'active':
        return 'Ce parcours de formation est actif';
      case 'planned':
        return 'Ce parcours de formation est programmé';
    }
  }

  get subtitle(): string {
    const start = this.startDate.value;
    const end = this.endDate.value;

    if (!start || !end) {
      return !start
        ? 'Aucune date de début prévue'
        : 'Aucune date de fin prévue';
    }

    if (this.status === 'active') {
      return `Fin prévue le ${this.formatDate(end)}`;
    }

    return `Début prévu le ${this.formatDate(start)}`;
  }

  get indicatorColor(): string {
    switch (this.status) {
      case 'inactive':
        return '#000000';
      case 'planned':
        return '#00A3DE';
      case 'active':
        return '#2ECC71';
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  clearStartDate() : void {
    this.startDate.reset();
    this.save();
  }

  clearEndDate() : void {
    this.endDate.reset();
    this.save();
  }

  addOneDay(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d;
  }

  addMinusOneDay(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d;
  }

  save(): void {
    const start = this.startDate.value;
    const end = this.endDate.value;

    this.trainingCoursesService.update(this.trainingCourseId, {
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
    }).subscribe({
      // next: (updated) => console.log('updated', updated),
      error: (err) => console.error(err)
    });
  }
}