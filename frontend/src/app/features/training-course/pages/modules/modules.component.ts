import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleCardComponent } from '../../components/module-card/module-card.component';
import { ModuleModel } from '../../models/module.model';
import { Observable } from 'rxjs';
import { TrainingCoursesService } from '../../services/training-courses.service';
import { ModulesService } from '../../services/modules.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss'],
  imports: [CommonModule, ModuleCardComponent],
})

export class ModulesComponent {
  modulesForTrainingCourse$!: Observable<ModuleModel[]>;
  isCreating = false;
  trainingCourseId!: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private trainingCourseService: TrainingCoursesService,
    private modulesService: ModulesService,
  ) {}

  ngOnInit(): void {
    this.trainingCourseId = Number(this.route.parent?.snapshot.paramMap.get('trainingCourseId'));

    this.modulesForTrainingCourse$ = this.trainingCourseService.getModulesForTrainingCourse(this.trainingCourseId);
  }

  onAdd(): void {
    if (this.isCreating) return;

    this.isCreating = true;

    this.modulesService.create({
      name: "Nouveau module",
      trainingCourseId: this.trainingCourseId
    }).subscribe({
      next: (created) => {
        this.router.navigate([
          '/training-courses',
          this.trainingCourseId,
          'modules',
          created.id,
          'editor'
        ]);
      },
      error: () => {
        this.isCreating = false;
      },
      complete: () => {
        this.isCreating = false;
      }
    });
  }
}