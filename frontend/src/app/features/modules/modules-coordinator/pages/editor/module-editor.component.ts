import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { BehaviorSubject } from 'rxjs';

import { ModuleContentItemComponent } from '../../components/module-content-item/module-content-item.component';
import { ModuleContentItemCard } from '../../components/module-content-item/module-content-item.model';
import { TabbarComponent } from '../../../../components/tabbar/tabbar.component';

import { Router, ActivatedRoute } from '@angular/router';
import { ModuleModel } from '../../models/module.model';
import { ModulesService } from '../../../services/modules.service';

import { WorkService } from '../../../../work-tool/services/work.service';
import { CreateWorkModel } from '../../../../work-tool/models/work.model';

import { ToolService } from '../../../../tools/services/tools.services';
import { ToolModel } from '../../../../tools/models/tool.model';


@Component({
  selector: 'app-module-editor',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ModuleContentItemComponent,
    TabbarComponent
  ],
  templateUrl: './module-editor.component.html',
  styleUrls: ['./module-editor.component.scss'],
})
export class ModuleEditorComponent {

  cards: ModuleContentItemCard[] = [
    {
      title: "Description",
      isRemovable: false,
      editRoute: ['description']
    }
  ];

  moduleData$ = new BehaviorSubject<ModuleModel | null>(null);

  moduleId!: number;
  trainingCourseId!: number;

  showAddOptions = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private moduleService: ModulesService,
    private workService: WorkService,
    private toolService: ToolService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('moduleId'));
    this.trainingCourseId = Number(this.route.snapshot.paramMap.get('trainingCourseId'));

    if (!id) return;

    this.moduleId = id;

    this.loadModuleData();
    this.loadTools();
    this.cdr.detectChanges();
  }

  // -----------------------
  // MODULE
  // -----------------------
  loadModuleData() {
    this.moduleService.getModulesById(this.moduleId).subscribe(module => {
      this.moduleData$.next(module);
    });
  }

  toolsTypeLabels(type: string): string {
    const labels: Record<string, string> = {
      WORK: 'Travail',
      FORM: 'Formulaire',
      ASSESSMENT: 'Évaluation',
      ACTIVITY: 'Activité',
    };

    return labels[type] ?? type;
  }

  // -----------------------
  // TOOLS → CARDS
  // -----------------------
  loadTools(): void {
    this.toolService.getToolsByModuleId(this.moduleId).subscribe((tools: ToolModel[]) => {

      const toolCards: ModuleContentItemCard[] = tools.map(tool => ({
        title: tool.name,
        subtitle: this.toolsTypeLabels(tool.type),
        isRemovable: true,
        editRoute: ['work', tool.id.toString()],
      }));

      this.cards = [
        {
          title: "Description",
          isRemovable: false,
          editRoute: ['description']
        },
        ...toolCards
      ];

      this.cdr.detectChanges();
    });
  }

  // -----------------------
  // DRAG & DROP
  // -----------------------
  drop(event: CdkDragDrop<ModuleContentItemCard[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const [removed] = this.cards.splice(event.previousIndex, 1);
      this.cards.splice(event.currentIndex, 0, removed);
    }
  }

  // -----------------------
  // MODULE UPDATE
  // -----------------------
  onTitleChange(newTitle: string) {
    this.moduleService.update(this.moduleId, {
      name: newTitle
    }).subscribe(updated => {
      this.moduleData$.next(updated);
    });
  }

  onDelete(): void {
    this.moduleService.delete(this.moduleId).subscribe(() => {
      this.router.navigate([
        `/coordinator/training-courses/${this.trainingCourseId}/modules`
      ]);
    });
  }

  // -----------------------
  // ADD MENU
  // -----------------------
  toggleAddOptions(): void {
    this.showAddOptions = !this.showAddOptions;
  }

  addFormulaire(): void {
    this.showAddOptions = false;
  }

  addWorkSubmission(): void {
    this.showAddOptions = false;

    const workData: CreateWorkModel = {
      name: "Nouvelle remise de travail",
      description: "Description.",
      maxAttempts: 1,
      moduleId: this.moduleId,
    };

    this.workService.createWork(workData).subscribe({
      next: () => {
        this.loadTools(); // refresh UI
      },
      error: (err) => {
        console.error('Erreur création WORK', err);
      }
    });
  }

  addEvaluation(): void {
    this.showAddOptions = false;
  }
}