import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleCardComponent } from '../../components/module-card/module-card.component';
import { ModuleCard } from '../../components/module-card/module-card.model' 

@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss'],
  imports: [CommonModule, ModuleCardComponent],
})
export class ModulesComponent {
  modulesInfos: ModuleCard[] = [ 
    {
      id: 1,
      title: 'Choix sujet',
      conditions: [
        {
          type: 'access',
          method: 'date',
          value: new Date('2026-05-01')
        },
        {
          type: 'access',
          method: 'uservalidation',
          value: 'Vroman Marie-Noël'
        },
        {
          type: 'success',
          method: 'toolsubmission',
          value: 'Form 3'
        },
        {
          type: 'success',
          method: 'supervisorvalidation',
          value: 'Supervisor'
        }
      ]
    },
    {
      id: 2,
      title: 'Cahier des charges',
      conditions: [
        {
          type: 'access',
          method: 'date',
          value: new Date('2026-05-01')
        },
        {
          type: 'success',
          method: 'toolsubmission',
          value: 'Work 1'
        }
      ]
    },
  ]
}