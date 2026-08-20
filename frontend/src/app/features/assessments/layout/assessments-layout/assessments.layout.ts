import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { AssessmentGridService } from '../../services/assessments.service';
import { EvaluationsVisibilityService } from '../../services/evaluations-visibility.service';
import { ProjectWithGridsModel, GridSummaryModel } from '../../../projects/models/project-with-grids.model';

@Component({
  selector: 'app-assessments-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './assessments.layout.html',
  styleUrls: ['./assessments.layout.scss'],
})
export class AssessmentsLayoutComponent implements OnInit {
  showProjectOptions = false;
  showGridOptions = false;

  projects!: ProjectWithGridsModel[];
  selectedProject?: ProjectWithGridsModel;
  selectedGrid?: GridSummaryModel;

  constructor(
    private assessmentGridService: AssessmentGridService,
    protected evaluationsVisibility: EvaluationsVisibilityService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const routeProjectId = Number(this.route.snapshot.paramMap.get('projectId'));
    const routeGridId = Number(this.route.snapshot.paramMap.get('assessmentId'));

    this.assessmentGridService.getProjectsWithGrids().subscribe(projects => {
      this.projects = projects;

      this.selectedProject =
        projects.find(project => project.id === routeProjectId) ?? projects[0];

      this.selectedGrid =
        this.selectedProject?.grids.find(grid => grid.id === routeGridId) ??
        this.selectedProject?.grids[0];

      // Si l'URL initiale ne pointait pas déjà vers ce projet/cette
      // grille (route '' au chargement, ou id invalide), on la met à jour
      // pour qu'elle reflète toujours la sélection courante.
      if (
        this.selectedProject &&
        this.selectedGrid &&
        (this.selectedProject.id !== routeProjectId || this.selectedGrid.id !== routeGridId)
      ) {
        this.navigateTo(this.selectedProject.id, this.selectedGrid.id, true);
      }
    });
  }

  selectProject(project: ProjectWithGridsModel): void {
    this.selectedProject = project;
    this.selectedGrid = project.grids[0];
    this.showProjectOptions = false;

    if (this.selectedGrid) {
      this.navigateTo(project.id, this.selectedGrid.id);
    }
  }

  selectGrid(grid: GridSummaryModel): void {
    this.selectedGrid = grid;
    this.showGridOptions = false;

    if (this.selectedProject) {
      this.navigateTo(this.selectedProject.id, grid.id);
    }
  }

  private navigateTo(projectId: number, gridId: number, replaceUrl = false): void {
    this.router.navigate(['/teacher', 'projects', projectId, 'assessments', gridId], { replaceUrl });
  }

  getStudentsLabel(project: ProjectWithGridsModel): string {
    if (project.students.length === 0) {
      return project.title ?? 'Projet';
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
}
