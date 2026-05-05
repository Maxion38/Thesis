import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingCoursesService } from '../../services/training-courses.service';

@Component({
  selector: 'app-infos',
  templateUrl: './infos.component.html',
  styleUrls: ['./infos.component.scss'],
})

export class InfosComponent {
  trainingCourseId! : number;
  
  constructor(
    private trainingCoursesService: TrainingCoursesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('trainingCourseId'));

    if (id) {
      this.trainingCourseId = Number(id);
    }
  }

  onDelete(): void {
    this.trainingCoursesService.delete(this.trainingCourseId).subscribe(() => {
      this.router.navigate(['/training-courses']);
    });
  }
}