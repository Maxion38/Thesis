import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { TabbarComponent } from '../../../../../components/tabbar/tabbar.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { ModuleModel } from '../../../../models/module.model';
import { ActivatedRoute } from '@angular/router';
import { ModulesService } from '../../../../services/modules.service';
import { switchMap, tap } from 'rxjs/operators';

type DisplayMode = 'original' | 'edit' | 'preview';

@Component({
  selector: 'app-training-courses',
  templateUrl: './module-description.component.html',
  styleUrls: ['./module-description.component.scss'],
  imports: [CommonModule, FormsModule, TabbarComponent],
})
export class ModuleDescriptionComponent {

  displayMode: DisplayMode = 'original';

  markdown = '';
  initialMarkdown = '';

  initialHtml!: SafeHtml;
  previewHtml!: SafeHtml;

  isEditing = false;

  moduleId!: number;

  // 🔁 trigger refresh
  private refresh$ = new BehaviorSubject<void>(undefined);

  // 🔥 DATA STREAM
  moduleData$!: Observable<ModuleModel>;

  constructor(
    private sanitizer: DomSanitizer,
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
        this.initialHtml = this.sanitize(marked.parse(this.markdown) as string);
        this.updatePreview();
        this.checkIfEditing();
      })
    );
  }

  chooseDisplayMode(mode: DisplayMode) {
    this.displayMode = mode;
    this.updatePreview();
  }

  onTextChange() {
    this.updatePreview();
    this.checkIfEditing();
  }

  updatePreview() {
    this.previewHtml = this.sanitize(marked.parse(this.markdown) as string);
  }

  checkIfEditing() {
    this.isEditing = this.markdown !== this.initialMarkdown;
  }

  private sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  saveEdit() {
    this.moduleService.update(this.moduleId, {
      description: this.markdown
    }).subscribe(() => {
      this.refresh$.next(); // 🔥 recharge les données
      this.displayMode = 'original';
    });
  }

  cancelEdit() {
    this.markdown = this.initialMarkdown;
    this.updatePreview();
    this.displayMode = 'original';
    this.checkIfEditing();
  }
}