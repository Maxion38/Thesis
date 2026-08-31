import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { merge, switchMap } from 'rxjs';
import { ModuleCardActionEvent, StudentModuleCardComponent } from '../../components/module-card/module-card.component';
import { SimpleModuleCardComponent } from '../../components/simple-module-card/simple-module-card.component';
import { MOCK_STUDENT_MODULES } from './modules.mock';
import { UsersService } from '../../../../users/services/users.service';
import { ModulesService } from '../../../services/modules.service';
import { ModuleOverviewModel } from '../../model/module-overview.model';
import { StudentToolCardModel } from '../../model/student-tool-card.model';
import { TrainingCourseContextService } from '../../../../training-course/services/training-course-context.service';
import { DropdownComponent } from '../../../../components/dropdown/dropdown.component';

interface FilterOption {
  value: string;
  label: string;
}

export interface UserToInvite {
  id: number,
  email: string,
  role: string,
}

@Component({
  selector: 'app-student-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, StudentModuleCardComponent, SimpleModuleCardComponent, DropdownComponent],
})
export class StudentModulesComponent implements OnInit {
  @ViewChild('tasksSection') tasksSectionRef!: ElementRef<HTMLDivElement>;
  @ViewChild('modulesSection') modulesSectionRef!: ElementRef<HTMLDivElement>;
  canScrollRight = true;

  mockModules: ModuleOverviewModel[] = MOCK_STUDENT_MODULES;
  modules!: ModuleOverviewModel[];
  selectedTaskFilter: string = 'TODO';

  readonly taskFilterOptions: FilterOption[] = [
    { value: 'TODO', label: 'Tâches à faire' },
    { value: 'ASSESSMENTS', label: 'Évaluations disponibles' },
    { value: 'NO_DATE', label: 'Tâches sans dates' },
    { value: 'ALL', label: 'Toutes les étapes' },
    { value: 'FINISHED', label: 'Tâches terminées' },
    { value: 'LOCKED', label: 'À venir' },
  ];

  get selectedTaskFilterLabel(): string {
    return this.taskFilterOptions.find(o => o.value === this.selectedTaskFilter)?.label ?? '';
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private usersService: UsersService,
    private modulesService: ModulesService,
    private trainingCourseContext: TrainingCourseContextService,
  ) {}

  ngOnInit(): void {
    merge(
      this.trainingCourseContext.initIfApplicable(),
      this.trainingCourseContext.changes$,
    ).pipe(
      switchMap(course => this.usersService.getMyFirstProject(course?.id)),
      switchMap(project => this.modulesService.getProjectModulesOverview(project.id))
    ).subscribe({
      next: (modules) => {
        this.modules = modules;
        // this.modules = this.mockModules; // only for testing
        console.log(modules);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  ngAfterViewInit(): void {
    const tasksSection = this.tasksSectionRef?.nativeElement;
    if (tasksSection) {
      tasksSection.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        tasksSection.scrollLeft += e.deltaY;
      }, { passive: false });
    }

    const modulesSection = this.modulesSectionRef?.nativeElement;
    if (modulesSection) {
      modulesSection.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        modulesSection.scrollLeft += e.deltaY;
      }, { passive: false });
    }
  }

  onModuleCardAction(event: ModuleCardActionEvent): void {
    console.log(event)

    this.router.navigate([
      '/student/modules',
      event.moduleId,
      'work',
      event.toolId
    ]);
  }

  onScrollT() {
    const el = this.tasksSectionRef.nativeElement;
    this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 10;
  }

  scrollRightT() {
    this.tasksSectionRef.nativeElement.scrollBy({ left: 400, behavior: 'smooth' });
  }

  // Flattens modules into one card per tool, pairing linked tools (eg.
  // a WORK linked to its grading ASSESSMENT) under a single card.
  get cards(): StudentToolCardModel[] {
    const result: StudentToolCardModel[] = [];

    for (const module of this.modules ?? []) {

      if (module.status?.locked) {
        result.push({
          id: `locked-${module.id}`,
          moduleId: module.id,
          moduleName: module.name,
          locked: true,
          lockedBy: module.status.lockedBy,
          tools: [],
        });
        continue;
      }

      const paired = new Set<number>();

      for (const tool of module.groups ?? []) {
        if (paired.has(tool.id)) continue;

        const linked = tool.linkedToolId
          ? module.groups.find(g => g.id === tool.linkedToolId)
          : undefined;

        const tools = linked ? [tool, linked] : [tool];
        tools.forEach(t => paired.add(t.id));

        result.push({
          id: `tool-${tool.id}`,
          moduleId: module.id,
          moduleName: module.name,
          locked: false,
          tools,
        });
      }
    }

    return result;
  }

  get filteredCards(): StudentToolCardModel[] {
    switch (this.selectedTaskFilter) {

      case 'TODO':
        return this.toDoCards;

      case 'ASSESSMENTS':
        return this.availableAssessmentsCards;

      case 'NO_DATE':
        return this.noDateCards;

      case 'ALL':
        return this.cards;

      case 'FINISHED':
        return this.finishedCards;

      case 'LOCKED':
        return this.lockedCards;

      default:
        return this.toDoCards;
    }
  }


  get toDoCards(): StudentToolCardModel[] {
    const filtered = this.cards.filter(card => {

      if (card.locked) return false;

      const hasPendingWorkOrForm = card.tools.some(tool =>
        (tool.type === 'WORK' || tool.type === 'FORM') &&
        tool.state !== 'SUBMITTED'
      );

      const hasPendingActivity = card.tools.some(tool =>
        tool.type === 'ACTIVITY' &&
        tool.date != null &&
        new Date(tool.date) >= this.today
      );

      return hasPendingWorkOrForm || hasPendingActivity;
    });

    return filtered.sort((a, b) => {
      const dateA = a.tools.find(t => t.type === 'WORK' || t.type === 'FORM' || t.type === 'ACTIVITY')?.date;
      const dateB = b.tools.find(t => t.type === 'WORK' || t.type === 'FORM' || t.type === 'ACTIVITY')?.date;

      if (dateA == null && dateB == null) return 0;
      if (dateA == null) return 1;  // a sans date → à la fin
      if (dateB == null) return -1; // b sans date → à la fin

      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }


  // this option should appears only if noDateCards.length > 0
  get noDateCards(): StudentToolCardModel[] {
    return this.cards.filter(card =>
      !card.locked &&
      card.tools.length > 0 &&
      card.tools.every(tool => tool.date == null)
    );
  }

  get availableAssessmentsCards(): StudentToolCardModel[] {
    return this.cards.filter(card =>
      card.tools.some(tool =>
        tool.type === 'ASSESSMENT' &&
        (tool.state === 'PUBLISHED' || tool.state === 'SEEN')
      )
    );
  }

  get finishedCards(): StudentToolCardModel[] {
    return this.cards.filter(card => {

      if (card.locked) return false;

      return card.tools.every(tool => {

        switch (tool.type) {

          case 'WORK':
          case 'FORM':
            return tool.state === 'SUBMITTED';

          case 'ASSESSMENT':
            return tool.state === 'PUBLISHED' || tool.state === 'SEEN';

          case 'ACTIVITY':
            return !tool.date || new Date(tool.date) < this.today;

          default:
            return true;
        }
      });
    });
  }

  get lockedCards(): StudentToolCardModel[] {
    return this.cards.filter(c => c.locked);
  }

  // Helper to avoid time and date comparison inconsistencies
  private get today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}