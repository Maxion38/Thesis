import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { TabbarComponent } from '../../../../../components/tabbar/tabbar.component';
import { ModuleModel } from '../../../models/module.model';
import { ModulesService } from '../../../../services/modules.service';
import { switchMap, tap } from 'rxjs/operators';
import { MarkdownCardComponent } from '../../../../../components/markdown-card/markdown-card.component';

type DisplayMode = 'original' | 'edit' | 'preview';

@Component({
  selector: 'app-module-work',
  templateUrl: './module-work.component.html',
  styleUrls: ['./module-work.component.scss'],
  imports: [CommonModule, FormsModule, TabbarComponent, MarkdownCardComponent],
})
export class ModuleWorkComponent {

  displayMode: DisplayMode = 'original';

  markdown = '';
  initialMarkdown = '';

  isEditing = false;
  moduleId!: number;

  private refresh$ = new BehaviorSubject<void>(undefined);

  moduleData$!: Observable<ModuleModel>;

  constructor(
    private route: ActivatedRoute,
    private moduleService: ModulesService
  ) {}

  ngOnInit(): void {
    this.moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));

    this.moduleData$ = this.refresh$.pipe(
      switchMap(() => this.moduleService.getModulesById(this.moduleId)),
      tap(module => {
        this.markdown = module?.description ?? '';
        this.initialMarkdown = this.markdown;
        this.checkIfEditing();
      })
    );
  }

  chooseDisplayMode(mode: DisplayMode) {
    this.displayMode = mode;
  }

  onTextChange() {
    this.checkIfEditing();
  }

  checkIfEditing() {
    this.isEditing = this.markdown !== this.initialMarkdown;
  }

  saveEdit() {
    this.moduleService.update(this.moduleId, {
      description: this.markdown
    }).subscribe(() => {
      this.refresh$.next();
      this.displayMode = 'original';
    });
  }

  cancelEdit() {
    this.markdown = this.initialMarkdown;
    this.displayMode = 'original';
    this.checkIfEditing();
  }
}