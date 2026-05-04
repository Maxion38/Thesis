import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '../back-button/back-button.component';

export interface Tabs {
  title: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-tabbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './tabbar.component.html',
  styleUrls: ['./tabbar.component.scss']
})

export class TabbarComponent {
  @Input() tabs?: Tabs[];
  @Input() title?: string;
  @Input() isTitleEditable?: boolean = false;
  @Input() subtitle?: string;
  @Input() backButton?: boolean = false;
  @Input() backRoute?: (string | number)[];

  @Output() titleChange = new EventEmitter<string>();

  @ViewChild('inputElement', { static: false }) inputElement!: ElementRef;

  isEditing = false;
  editedTitle = '';

  startEdit() {
    this.isEditing = true;
    this.editedTitle = this.title || '';
    setTimeout(() => {
      if (this.inputElement) {
        this.inputElement.nativeElement.focus();
      }
    }, 0);
  }

  saveEdit() {
    this.titleChange.emit(this.editedTitle);
    this.isEditing = false;
  }

  cancelEdit() {
    this.isEditing = false;
  }
}

