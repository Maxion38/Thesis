import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModulesService } from '../../services/modules.service';
import { MarkdownCardComponent } from '../../../components/markdown-card/markdown-card.component';

type DisplayMode = 'original' | 'edit' | 'preview';

@Component({
  selector: 'app-training-courses',
  templateUrl: './module-description.component.html',
  styleUrls: ['./module-description.component.scss'],
  imports: [CommonModule, FormsModule, MarkdownCardComponent],
})
export class ModuleDescriptionComponent {
  displayMode: DisplayMode = 'original';

  markdown = '';
  initialMarkdown = '';

  moduleTitle = '';

  isEditing = false;
  moduleId!: number;

  constructor(
    private route: ActivatedRoute,
    private moduleService: ModulesService
  ) {}

  ngOnInit(): void {
    this.moduleId = Number(this.route.parent?.snapshot.paramMap.get('moduleId'));
    this.loadModuleDescription();
  }

  private loadModuleDescription() {
    this.moduleService.getModulesById(this.moduleId)
      .subscribe(module => {
        this.markdown = module.description ?? '';
        this.moduleTitle = module.name ?? '';
        this.initialMarkdown = this.markdown;
        this.checkIfEditing();
      });
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
      this.initialMarkdown = this.markdown;
      this.displayMode = 'original';
      this.checkIfEditing();
    });
  }

  cancelEdit() {
    this.markdown = this.initialMarkdown;
    this.displayMode = 'original';
    this.checkIfEditing();
  }
}