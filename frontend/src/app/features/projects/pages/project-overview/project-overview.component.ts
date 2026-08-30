import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { merge } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProjectsService } from '../../services/projects.service';
import { ProjectWithGridsModel } from '../../models/project-with-grids.model';
import { ProjectOverviewModuleModel, ProjectOverviewToolModel } from '../../models/project-overview.model';
import { TrainingCourseContextService } from '../../../training-course/services/training-course-context.service';
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { WorkService } from '../../../work-tool/services/work.service';

export type ProjectsScope = 'mine' | 'all';

export type ModuleDisplayItem =
  | { kind: 'single'; tool: ProjectOverviewToolModel }
  | { kind: 'pair'; primary: ProjectOverviewToolModel; secondary: ProjectOverviewToolModel };

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownComponent, BackButtonComponent],
  templateUrl: './project-overview.component.html',
  styleUrls: ['./project-overview.component.scss'],
})
export class ProjectOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectsService = inject(ProjectsService);
  private trainingCourseContext = inject(TrainingCourseContextService);
  private workService = inject(WorkService);

  scope: ProjectsScope = 'mine';
  projects: ProjectWithGridsModel[] = [];
  selectedProject?: ProjectWithGridsModel;
  modules: ProjectOverviewModuleModel[] = [];
  loading = false;

  ngOnInit(): void {
    const queryScope = this.route.snapshot.queryParamMap.get('scope');
    this.scope = queryScope === 'all' ? 'all' : 'mine';

    merge(
      this.trainingCourseContext.initIfApplicable(),
      this.trainingCourseContext.changes$,
    ).pipe(
      switchMap(course => this.projectsService.getProjectsWithGrids(course?.id, this.scope === 'mine')),
    ).subscribe({
      next: (projects) => {
        this.projects = projects;

        const routeProjectId = Number(this.route.snapshot.paramMap.get('projectId'));
        this.selectedProject = projects.find(project => project.id === routeProjectId) ?? projects[0];

        if (this.selectedProject) {
          this.loadOverview(this.selectedProject.id);
        }
      },
      error: (err) => {
        console.error('Error loading projects', err);
      }
    });
  }

  selectProject(project: ProjectWithGridsModel): void {
    if (project.id === this.selectedProject?.id) return;

    this.selectedProject = project;
    this.router.navigate(['/teacher', 'projects', project.id], {
      queryParams: { scope: this.scope },
      replaceUrl: true,
    });
    this.loadOverview(project.id);
  }

  openAssessment(tool: ProjectOverviewToolModel): void {
    if (!this.selectedProject) return;
    this.router.navigate(['/teacher', 'projects', this.selectedProject.id, 'assessments', tool.id], {
      queryParams: { scope: this.scope },
    });
  }

  // Jumps straight to the assessment's split-screen (grid + linked PDF
  // submission side by side), from either card of a linked pair.
  openSplitScreen(tool: ProjectOverviewToolModel, event: Event): void {
    event.stopPropagation();
    if (!this.selectedProject) return;

    const assessmentToolId = tool.type === 'ASSESSMENT' ? tool.id : tool.linkedToolId;
    if (!assessmentToolId) return;

    this.router.navigate(['/teacher', 'projects', this.selectedProject.id, 'assessments', assessmentToolId], {
      queryParams: { scope: this.scope },
    });
  }

  // Groups a module's tools so that a linked WORK/ASSESSMENT pair renders
  // as adjacent cards with the split-screen button between them.
  getModuleItems(module: ProjectOverviewModuleModel): ModuleDisplayItem[] {
    const items: ModuleDisplayItem[] = [];
    const paired = new Set<number>();

    for (const tool of module.tools) {
      if (paired.has(tool.id)) continue;

      const linked = tool.linkedToolId
        ? module.tools.find(candidate => candidate.id === tool.linkedToolId)
        : undefined;

      if (linked) {
        paired.add(tool.id);
        paired.add(linked.id);
        const [primary, secondary] = tool.type === 'WORK' ? [tool, linked] : [linked, tool];
        items.push({ kind: 'pair', primary, secondary });
        continue;
      }

      items.push({ kind: 'single', tool });
    }

    return items;
  }

  downloadSubmission(tool: ProjectOverviewToolModel): void {
    if (!tool.submission) return;

    this.workService.getSubmissionFile(tool.id, tool.submission.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tool.submission!.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error downloading submission', err),
    });
  }

  get backRoute(): (string | number)[] {
    return ['/teacher', 'projects', this.scope === 'mine' ? 'myProjects' : 'all'];
  }

  getProjectLabel(project: ProjectWithGridsModel): string {
    return project.title ?? this.getStudentsLabel(project);
  }

  getStudentsLabel(project: ProjectWithGridsModel): string {
    if (project.students.length === 0) {
      return project.title ?? 'Projet';
    }
    return project.students
      .map(student => `${student.firstname ?? ''} ${student.surname}`.trim())
      .join(', ');
  }

  private loadOverview(projectId: number): void {
    this.loading = true;
    this.projectsService.getProjectOverview(projectId).subscribe({
      next: (modules) => {
        this.modules = modules;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading project overview', err);
        this.loading = false;
      },
    });
  }
}
