import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProjectsService } from '../../services/projects.service';
import { ProjectWithGridsModel } from '../../models/project-with-grids.model';
import { TrainingCourseContextService } from '../../../training-course/services/training-course-context.service';

@Component({
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class MyProjectsComponent implements OnInit {
  projects: ProjectWithGridsModel[] = [];
  filteredProjects: ProjectWithGridsModel[] = [];

  searchText: string = '';

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private projectsService: ProjectsService,
    private trainingCourseContext: TrainingCourseContextService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    merge(
      this.trainingCourseContext.initIfApplicable(),
      this.trainingCourseContext.changes$,
    ).pipe(
      switchMap(course => this.projectsService.getProjectsWithGrids(course?.id, true)),
    ).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = projects;
        this.applyFilters();
        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error loading projects', err);
      }
    });
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    const result = this.projects
      .map(project => {
        let score = 0;

        if (search) {
          const studentsText = this.getStudentsLabel(project).toLowerCase();
          const title = (project.title ?? '').toLowerCase();

          if (studentsText === search || title === search) score += 100;
          else if (studentsText.startsWith(search) || title.startsWith(search)) score += 50;
          else if (studentsText.includes(search) || title.includes(search)) score += 10;
        }

        return { project, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(x => x.project);

    this.filteredProjects = result;
  }

  getStudentsLabel(project: ProjectWithGridsModel): string {
    if (project.students.length === 0) {
      return 'Aucun étudiant';
    }
    return project.students
      .map(student => `${student.firstname ?? ''} ${student.surname}`.trim())
      .join(', ');
  }

  isClickable(project: ProjectWithGridsModel): boolean {
    return true;
  }

  onProjectCardClick(project: ProjectWithGridsModel): void {
    this.router.navigate(['/teacher/projects', project.id], { queryParams: { scope: 'mine' } });
  }
}
