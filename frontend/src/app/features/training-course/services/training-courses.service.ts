import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class TrainingCourseStateService {
  title = signal('Nom du parcours');
}