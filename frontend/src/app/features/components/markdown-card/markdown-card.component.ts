import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markdown-card.component.html',
  styleUrls: ['./markdown-card.component.scss'],
})
export class MarkdownCardComponent implements OnChanges {

  @Input() markdown: string = '';
  @Input() className: string = ''; // for external custom styling

  html: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markdown']) {
      this.render();
    }
  }

  private render() {
    // Bound as a plain string (not SafeHtml) so Angular's DomSanitizer runs
    // on it — markdown here comes from module/work descriptions, and marked
    // passes through raw HTML embedded in the source, so an unsanitized
    // bypassSecurityTrustHtml would let a compromised author account inject
    // a stored XSS payload.
    this.html = marked.parse(this.markdown || '') as string;
  }
}