import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleDetailsModel } from '../../../model/module-details.model';
import { ModulesService } from '../../../../services/modules.service';
import { UsersService } from '../../../../../users/services/users.service';
import { switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MarkdownCardComponent } from '../../../../../components/markdown-card/markdown-card.component';


@Component({
  selector: 'app-student-module-description',
  standalone: true,
  imports: [CommonModule, MarkdownCardComponent],
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
})
export class StudentModuleDescriptionComponent {
  module!: ModuleDetailsModel;

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private modulesService: ModulesService,
  ) {}

  ngOnInit(): void {
    const moduleId = Number(this.route.parent?.snapshot.paramMap.get('moduleId'));

    this.usersService.getMyFirstProject().pipe(
      switchMap(project => this.modulesService.getProjectModuleDetails(moduleId, project.id))
    ).subscribe({
      next: (module) => {
        this.module = module;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  get description(): string {
    return this.module?.description ?? '';
  }
}