import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
// import { Observable } from 'rxjs';
import { CardComponent } from '../../components/card/card.component'

@Component({
  selector: 'app-training-courses',
  imports: [CommonModule, CardComponent, RouterOutlet, RouterModule],
  templateUrl: './training-courses.component.html',
  styleUrls: ['./training-courses.component.scss'],
})

export class TrainingCourseComponent {
  /*
  modules$: Observable<Module[]>;

  constructor(private modulesService: ModulesService) {
    this.modules$ = this.modulesService.getModules();
  }
  */
}