import { Directive, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';

// Permet de récupérer la référence native d'un élément répété dans un
// *ngFor (ex. un critère parmi plusieurs en mode "grille complète"), là où
// un simple #templateRef + ViewChildren ne suffit plus car des lignes
// peuvent être conditionnellement absentes du DOM (ngIf) et décaler les
// index.
@Directive({
  selector: '[appRegisterElement]',
  standalone: true,
})
export class RegisterElementDirective implements OnInit {
  @Input('appRegisterElement') key!: number;
  @Output() elementRegistered = new EventEmitter<{ key: number; element: HTMLElement }>();

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.elementRegistered.emit({ key: this.key, element: this.elementRef.nativeElement });
  }
}
