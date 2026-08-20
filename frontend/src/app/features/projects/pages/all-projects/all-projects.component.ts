import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { ProjectWithGridsModel } from '../../models/project-with-grids.model';

@Component({
  selector: 'app-all-projects',
  templateUrl: './all-projects.component.html',
  styleUrls: ['./all-projects.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class AllProjectsComponent implements OnInit {
  projects: ProjectWithGridsModel[] = [];
  filteredProjects: ProjectWithGridsModel[] = [];

  searchText: string = '';

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private projectsService: ProjectsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.projectsService.getProjectsWithGrids().subscribe({
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

  getInitials(project: ProjectWithGridsModel): string {
    const first = project.students[0];
    if (!first) return '?';
    return ((first.firstname?.charAt(0) ?? '') + first.surname.charAt(0)).toUpperCase();
  }

  isClickable(project: ProjectWithGridsModel): boolean {
    return project.grids.length > 0;
  }

  onProjectCardClick(project: ProjectWithGridsModel): void {
    if (!this.isClickable(project)) return;
    this.router.navigate(['/teacher/projects', project.id, 'assessments', project.grids[0].id]);
  }
}
