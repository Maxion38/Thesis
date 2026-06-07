import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { TrainingCoursesService } from '../../services/training-courses.service';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';

type PlanningStatus = 'inactive' | 'planned' | 'active';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
  imports: [
    CommonModule,
    DatePickerComponent,
  ],
})
export class PlanningComponent implements OnInit {
  startDate = new FormControl<Date | null>(null);
  endDate = new FormControl<Date | null>(null);
  today: Date = new Date(new Date().setHours(0, 0, 0, 0));
  // Valeur neutre quand il n'y a pas de borne max réelle
  maxFallback = new Date(9999, 11, 31);
  trainingCourseId!: number;

  constructor(
    private route: ActivatedRoute,
    private trainingCoursesService: TrainingCoursesService,
  ) {}

  ngOnInit(): void {
    this.trainingCourseId = Number(
      this.route.parent?.snapshot.paramMap.get('trainingCourseId')
    );

    this.trainingCoursesService.getById(this.trainingCourseId).subscribe(course => {
      this.startDate.setValue(course.startDate ? new Date(course.startDate) : null);
      this.endDate.setValue(course.endDate ? new Date(course.endDate) : null);
    });
  }

  onStartDateChosed(date: Date | null): void {
    this.startDate.setValue(date);
    this.save();
  }

  onEndDateChosed(date: Date | null): void {
    this.endDate.setValue(date);
    this.save();
  }

  // --- Getters status / affichage (inchangés) ---

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
      case 'inactive': return 'Ce parcours de formation est inactif';
      case 'active':   return 'Ce parcours de formation est actif';
      case 'planned':  return 'Ce parcours de formation est programmé';
    }
  }

  get subtitle(): string {
    const start = this.startDate.value;
    const end = this.endDate.value;
    if (!start || !end) return !start ? 'Aucune date de début prévue' : 'Aucune date de fin prévue';
    if (this.status === 'active') return `Fin prévue le ${this.formatDate(end)}`;
    return `Début prévu le ${this.formatDate(start)}`;
  }

  get indicatorColor(): string {
    switch (this.status) {
      case 'inactive': return '#000000';
      case 'planned':  return '#00A3DE';
      case 'active':   return '#2ECC71';
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
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
    }).subscribe({ error: (err) => console.error(err) });
  }
}