import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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

  html!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markdown']) {
      this.render();
    }
  }

  private render() {
    const rawHtml = marked.parse(this.markdown || '') as string;
    this.html = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }
}