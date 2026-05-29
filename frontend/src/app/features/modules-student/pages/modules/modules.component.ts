import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { StudentModuleCardComponent } from '../../components/module-card/module-card.component';
import { MOCK_STUDENT_MODULES } from './modules.mock';
import { UsersService } from '../../../users/services/users.service';
import { ModulesService } from '../../../modules-coordinator/services/modules.service'; 
import { ModuleOverviewModel } from '../../model/module-overview.model';

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
  imports: [CommonModule, FormsModule, RouterModule, StudentModuleCardComponent],
})
export class StudentModulesComponent implements OnInit {
  @ViewChild('tasksSection') tasksSectionRef!: ElementRef<HTMLDivElement>;
  canScrollRight = true;

  mockModules: ModuleOverviewModel[] = MOCK_STUDENT_MODULES;
  modules!: ModuleOverviewModel[];
  selectedTaskFilter: string = 'TODO';
  selectedOtherFilter: string = 'OTHER';

  constructor(
    private usersService: UsersService,
    private modulesService: ModulesService,
  ) {}

  ngOnInit(): void {
    this.usersService.getMyFirstProject().pipe(
      switchMap(project => this.modulesService.getProjectModulesOverview(project.id))
    ).subscribe({
      next: (modules) => {
        this.modules = modules;
        this.modules = this.mockModules; // only for testing
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.tasksSectionRef?.nativeElement;
    if (!el) return;

    el.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }, { passive: false });
  }

  onScroll() {
    const el = this.tasksSectionRef.nativeElement;
    this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 10;
  }

  scrollRight() {
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
        console.log(this.othersModules);
        return this.othersModules;

      case 'FINISHED':
        console.log(this.finishedModules);
        return this.finishedModules;

      case 'LOCKED':
        console.log(this.lockedModules);
        return this.lockedModules;

      default:
        return this.othersModules;
    }
  }


  get toDoModules(): ModuleOverviewModel[] {
    return this.modules?.filter(module => {

      if (module.status?.locked) return false; // fix bug 1

      const hasPendingWorkOrForm = module.groups?.some(group =>
        (group.type === 'WORK' || group.type === 'FORM') &&
        group.date != null &&
        group.state !== 'SUBMITTED'
      );

      const hasPendingActivity = module.groups?.some(group =>
        group.type === 'ACTIVITY' &&
        group.date != null &&
        new Date(group.date) >= this.today
      );

      return hasPendingWorkOrForm || hasPendingActivity;
    }) ?? [];
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