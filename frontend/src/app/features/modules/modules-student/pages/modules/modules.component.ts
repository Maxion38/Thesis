import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { merge, switchMap } from 'rxjs';
import { ModuleCardActionEvent, StudentModuleCardComponent } from '../../components/module-card/module-card.component';
import { MOCK_STUDENT_MODULES } from './modules.mock';
import { UsersService } from '../../../../users/services/users.service';
import { ModulesService } from '../../../services/modules.service';
import { ModuleOverviewModel } from '../../model/module-overview.model';
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
  imports: [CommonModule, RouterModule, StudentModuleCardComponent, DropdownComponent],
})
export class StudentModulesComponent implements OnInit {
  @ViewChild('tasksSection') tasksSectionRef!: ElementRef<HTMLDivElement>;
  @ViewChild('otherSection') otherSectionRef!: ElementRef<HTMLDivElement>;
  canScrollRight = true;

  mockModules: ModuleOverviewModel[] = MOCK_STUDENT_MODULES;
  modules!: ModuleOverviewModel[];
  selectedTaskFilter: string = 'TODO';
  selectedOtherFilter: string = 'OTHER';

  readonly taskFilterOptions: FilterOption[] = [
    { value: 'TODO', label: 'Tâches à faire' },
    { value: 'ASSESSMENTS', label: 'Évaluations disponibles' },
    { value: 'NO_DATE', label: 'Tâches sans dates' },
    { value: 'ALL', label: 'Tous les modules' },
  ];

  readonly otherFilterOptions: FilterOption[] = [
    { value: 'OTHER', label: 'Autre' },
    { value: 'FINISHED', label: 'Tâches terminées' },
    { value: 'LOCKED', label: 'À venir' },
  ];

  get selectedTaskFilterLabel(): string {
    return this.taskFilterOptions.find(o => o.value === this.selectedTaskFilter)?.label ?? '';
  }

  get selectedOtherFilterLabel(): string {
    return this.otherFilterOptions.find(o => o.value === this.selectedOtherFilter)?.label ?? '';
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
    if (!tasksSection) return;

    tasksSection.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      tasksSection.scrollLeft += e.deltaY;
    }, { passive: false });

    const otherSection = this.otherSectionRef?.nativeElement;
    if (!otherSection) return;

    otherSection.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      otherSection.scrollLeft += e.deltaY;
    }, { passive: false });
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

  onScrollO() {
    const el = this.tasksSectionRef.nativeElement;
    this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 10;
  }

  scrollRightO() {
    this.tasksSectionRef.nativeElement.scrollBy({ left: 400, behavior: 'smooth' });
  }

  get filteredModules(): ModuleOverviewModel[] {
    switch (this.selectedTaskFilter) {

      case 'TODO':
        return this.toDoModules;

      case 'ASSESSMENTS':
        return this.availableAssessmentsModules;

      case 'NO_DATE':
        return this.noDateModules;

      case 'ALL':
        return this.modules ?? [];

      default:
        return this.toDoModules;
    }
  }

  get filteredOtherModules(): ModuleOverviewModel[] {
    switch (this.selectedOtherFilter) {

      case 'OTHER':
        return this.othersModules;

      case 'FINISHED':
        return this.finishedModules;

      case 'LOCKED':
        return this.lockedModules;

      default:
        return this.othersModules;
    }
  }


  get toDoModules(): ModuleOverviewModel[] {
    const filtered = this.modules?.filter(module => {

      if (module.status?.locked) return false;

      const hasPendingWorkOrForm = module.groups?.some(group =>
        (group.type === 'WORK' || group.type === 'FORM') &&
        group.state !== 'SUBMITTED'
      );

      const hasPendingActivity = module.groups?.some(group =>
        group.type === 'ACTIVITY' &&
        group.date != null &&
        new Date(group.date) >= this.today
      );

      return hasPendingWorkOrForm || hasPendingActivity;
    }) ?? [];

    return filtered.sort((a, b) => {
      const dateA = a.groups?.find(g => g.type === 'WORK' || g.type === 'FORM' || g.type === 'ACTIVITY')?.date;
      const dateB = b.groups?.find(g => g.type === 'WORK' || g.type === 'FORM' || g.type === 'ACTIVITY')?.date;

      if (dateA == null && dateB == null) return 0;
      if (dateA == null) return 1;  // a sans date → à la fin
      if (dateB == null) return -1; // b sans date → à la fin

      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }
  

  // this option should appears only if noDateModules.length > 0
  get noDateModules(): ModuleOverviewModel[] {
    return this.modules?.filter(module =>
      module.groups?.every(group => group.date == null)
    ) ?? [];
  }

  get availableAssessmentsModules(): ModuleOverviewModel[] {
    return this.modules?.filter(module =>
      module.groups?.some(group =>
        group.type === 'ASSESSMENT' &&
        group.state === 'CORRECTED'
      )
    ) ?? [];
  }

  get finishedModules(): ModuleOverviewModel[] {
    return this.modules?.filter(module => {

      if (module.status?.locked) return false;

      const allOk = module.groups?.every(group => {

        switch (group.type) {

          case 'WORK':
          case 'FORM':
            return group.state === 'SUBMITTED';

          case 'ASSESSMENT':
            return group.state === 'CORRECTED';

          case 'ACTIVITY':
            return !group.date || new Date(group.date) < this.today;

          default:
            return true;
        }
      });

      return allOk;
    }) ?? [];
  }

  get lockedModules(): ModuleOverviewModel[] {
    return this.modules?.filter(m => m.status?.locked) ?? [];
  }

  get othersModules(): ModuleOverviewModel[] {
    const finishedIds = new Set(this.finishedModules.map(m => m.id));
    const lockedIds = new Set(this.lockedModules.map(m => m.id));

    return this.modules?.filter(m =>
      finishedIds.has(m.id) || lockedIds.has(m.id)
    ) ?? [];
  }

  // Helper to avoid time and date comparison inconsistencies 
  private get today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}