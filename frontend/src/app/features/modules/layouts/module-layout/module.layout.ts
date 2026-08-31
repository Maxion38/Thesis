import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Observable, switchMap, map } from 'rxjs';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';
import { ModulesService } from '../../services/modules.service';
import { ModuleModel } from '../../modules-coordinator/models/module.model';
import { ToolService } from '../../../tools/services/tools.services';
import { ToolModel } from '../../../tools/models/tool.model';
import { CreateWorkModel } from '../../../work-tool/models/work.model';
import { WorkService } from '../../../work-tool/services/work.service';
import { FormsModule } from '@angular/forms';
import { NavbarItemComponent } from '../../components/navbar-item/navbar-item.component';
import { AuthService } from '../../../auth/services/auth.service';
import { RoleType } from '../../../entities/role.entity';
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';

@Component({
  selector: 'app-module-layout',
  standalone: true,
  imports: [TabbarComponent, RouterOutlet, CommonModule, RouterLink, RouterLinkActive, FormsModule, NavbarItemComponent, DropdownComponent],
  templateUrl: './module.layout.html',
  styleUrls: ['./module.layout.scss'],
})
export class ModuleLayoutComponent implements OnInit {
  trainingCourseId!: number;
  moduleId!: number;
  module$!: Observable<ModuleModel>;
  tools$!: Observable<ToolModel[]>;
  userRole!: RoleType;

  tabbarItems: Tabs[] = [];
  isVisible: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modulesService: ModulesService,
    private toolService: ToolService,
    private workService: WorkService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getFirstRole();

    this.trainingCourseId = Number(this.route.snapshot.paramMap.get('trainingCourseId'));
    this.moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));

    this.module$ = this.route.paramMap.pipe(
      switchMap(params =>
        this.modulesService.getModulesById(
          Number(params.get('moduleId'))
        )
      )
    );

    this.loadTools();
  }

  loadTools():void {
    this.tools$ = this.route.paramMap.pipe(
      switchMap(params =>
        this.toolService.getToolsByModuleId(
          Number(params.get('moduleId'))
        )
      ),
      map(tools => this.orderWithLinkedToolsAdjacent(tools)),
    );
  }

  // Keeps a linked pair of tools (e.g. a Work and its assessment grid) next
  // to each other in the sidebar so their gap can be visually collapsed.
  private orderWithLinkedToolsAdjacent(tools: ToolModel[]): ToolModel[] {
    const ordered: ToolModel[] = [];
    const placed = new Set<number>();

    for (const tool of tools) {
      if (placed.has(tool.id)) continue;

      ordered.push(tool);
      placed.add(tool.id);

      const partner = tools.find(t => t.id === tool.linkedToolId);
      if (partner && !placed.has(partner.id)) {
        ordered.push(partner);
        placed.add(partner.id);
      }
    }

    return ordered;
  }

  isLinkedWithNext(tools: ToolModel[], index: number): boolean {
    const tool = tools[index];
    const next = tools[index + 1];
    return !!next && (tool.linkedToolId === next.id || next.linkedToolId === tool.id);
  }

  isLinkedWithPrevious(tools: ToolModel[], index: number): boolean {
    return index > 0 && this.isLinkedWithNext(tools, index - 1);
  }

  toggleNavbar():void {
    this.isVisible = !this.isVisible;
  }

  getRouteType(type: string): string {
    switch (type) {
      case 'WORK':
        return 'work';
      case 'DESCRIPTION':
        return 'description';
      default:
        return type.toLowerCase();
    }
  }

  getToolIcon(type: string): string {
    switch (type) {
      case 'WORK':
        return 'upload_file';
      case 'ASSESSMENT':
        return 'fact_check';
      case 'FORM':
        return 'list_alt';
      case 'ACTIVITY':
        return 'event';
      default:
        return 'upload_file';
    }
  }

  addForm(): void {
  }

  addWorkSubmission(): void {
    const workData: CreateWorkModel = {
      name: "Nouvelle remise de travail",
      description: "Veuillez insérer une description.",
      maxAttempts: 1,
      moduleId: this.moduleId,
    };

    this.workService.createWork(workData).subscribe({
      next: () => {
        this.loadTools();
      },
      error: (err) => {
        console.error('Erreur création WORK', err);
      }
    });
  }

  addAssessment(): void {
  }

  onToolNameChange(tool: ToolModel, newName: string): void {
    const previousName = tool.name; // save before mutation
    tool.name = newName;            // optimistic update

    this.toolService.updateTool(tool.id, {name: newName}).subscribe({
      error: (err) => {
        console.error('Erreur mise à jour nom', err);
        tool.name = previousName;   // rollback
      }
    });
  }

  deleteTool(tool : ToolModel): void {
    this.toolService.deleteTool(tool.id).subscribe({
      next: () => {
        this.router.navigate(['/coordinator', 'training-courses', this.trainingCourseId, 'modules', this.moduleId, 'description'])
        this.loadTools();
      },
      error: (err) => console.error('Erreur suppression tool', err)
    });
  }

  onModuleTitleChange(module: ModuleModel, newName: string) {
    const previousName = module.name; // save before mutation
    module.name = newName;            // optimistic update

    this.modulesService.update(module.id, {name: newName}).subscribe({
      error: (err) => {
        console.error('Erreur mise à jour nom', err);
        module.name = previousName;   // rollback
      }
    });
  }

  deleteModule(): void {
    this.modulesService.delete(this.moduleId).subscribe(() => {
      this.router.navigate([
        `/coordinator/training-courses/${this.trainingCourseId}/modules`
      ]);
    });
  }

  get backRoute(): any[] {
    switch (this.userRole) {
      case 'COORDINATOR':
        return ['/', 'coordinator', 'training-courses', this.trainingCourseId, 'modules'];

      case 'STUDENT':
        return ['/', 'student', 'modules'];

      default:
        return ['/'];
    }
  }
}