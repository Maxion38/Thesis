import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { TabbarComponent } from '../../../../../components/tabbar/tabbar.component';

@Component({
  selector: 'app-training-courses',
  templateUrl: './module-description.component.html',
  styleUrls: ['./module-description.component.scss'],
  imports: [CommonModule, FormsModule, TabbarComponent],
})

export class ModuleDescriptionComponent {
  isEditMode = false;
  markdown = `# Module description

Start writing your module description using markdown.

## Supported syntax
- **Bold**
- *Italic*
- [Links](https://example.com)
- Lists
- \`Inline code\`
- Code blocks

### Example
Write your text here and switch to preview mode.`;
  previewHtml!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {
    this.previewHtml = this.sanitize(marked.parse(this.markdown) as string);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.updatePreview();
    }
  }

  updatePreview(): void {
    this.previewHtml = this.sanitize(marked.parse(this.markdown) as string);
  }

  private sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
