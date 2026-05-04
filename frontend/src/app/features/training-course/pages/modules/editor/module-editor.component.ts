import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { ModuleContentItemComponent } from '../../../components/module-content-item/module-content-item.component';
import { ModuleContentItemCard } from '../../../components/module-content-item/module-content-item.model';
import { TabbarComponent } from '../../../../components/tabbar/tabbar.component';
import { ActivatedRoute } from '@angular/router';
import { ModuleModel } from '../../../models/module.model';
import { ModulesService } from '../../../services/modules.service';

@Component({
  selector: 'app-module-editor',
  standalone: true,
  imports: [CommonModule, DragDropModule, ModuleContentItemComponent, TabbarComponent],
  templateUrl: './module-editor.component.html',
  styleUrls: ['./module-editor.component.scss'],
})

export class ModuleEditorComponent {
  cards: ModuleContentItemCard[] = [
    {
      title: "Description",
      isRemovable: false,
      editRoute: ['description']
    },
    /*
    {
      title: "Formulaire",
      subtitle: "Informations générales sur le sujet",
      editRoute: ['description']
    },*/
  ]

  moduleData$!: Observable<ModuleModel>;

  constructor(
    private route: ActivatedRoute,
    private moduleService: ModulesService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('moduleId'));

    this.moduleData$ = this.moduleService.getModulesById(id);
  }

  drop(event: CdkDragDrop<ModuleContentItemCard[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const [removed] = this.cards.splice(event.previousIndex, 1);
      this.cards.splice(event.currentIndex, 0, removed);
    }
  }
}