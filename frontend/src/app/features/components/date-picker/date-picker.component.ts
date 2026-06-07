import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
})
export class DatePickerComponent implements OnInit, OnChanges {
  @Input() title!: string;
  @Input() date?: Date | null;
  @Input() minDate?: Date;
  @Input() maxDate?: Date;

  @Output() chosedDate = new EventEmitter<Date | null>();

  control = new FormControl<Date | null>(null);

  ngOnInit(): void {
    this.control.setValue(this.date ?? null, { emitEvent: false });

    this.control.valueChanges.subscribe(value => {
      this.chosedDate.emit(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Sync valeur externe → control (ex: clear de l'autre date dans le parent)
    if (changes['date'] && !changes['date'].firstChange) {
      const incoming = changes['date'].currentValue ?? null;
      if (this.control.value !== incoming) {
        this.control.setValue(incoming, { emitEvent: false });
      }
    }
  }

  onClear(): void {
    this.control.setValue(null, { emitEvent: false });
    this.chosedDate.emit(null);
  }
}