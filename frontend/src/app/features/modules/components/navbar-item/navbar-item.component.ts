import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar-item.component.html',
  styleUrls: ['./navbar-item.component.scss']
})
export class NavbarItemComponent {
  @Input() name: string = '';
  @Input() active: boolean = false;
  @Input() isEditable: boolean = false;
  @Input() isDeletable: boolean = false;

  @Output() deleted = new EventEmitter<void>();
  @Output() nameChange = new EventEmitter<string>();

  @HostBinding('class.active') get isActiveClass() {
    return this.active;
  }

  isEditing = false;
  editedName = '';

  startEdit() {
    this.editedName = this.name;
    this.isEditing = true;
  }

  saveEdit() {
    this.nameChange.emit(this.editedName);
    this.isEditing = false;
  }

  cancelEdit() {
    this.isEditing = false;
  }
}