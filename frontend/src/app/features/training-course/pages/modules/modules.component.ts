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
      accessConditions: [
        {
          method: 'date',
          value: new Date('2026-05-01')
        },
        {
          method: 'uservalidation',
          value: 'Vroman Marie-Noël'
        },
      ],
      successConditions: [
        {
          method: 'toolsubmission',
          value: 'Form 3'
        },
        {
          method: 'supervisorvalidation',
          value: 'Supervisor'
        }
      ]
    },
    {
      id: 2,
      title: 'Cahier des charges',
      accessConditions: [
        {
          method: 'date',
          value: new Date('2026-05-01')
        },
      ],
      successConditions: [
        {
          method: 'toolsubmission',
          value: 'Work 1'
        }
      ]
    },
    {
      id: 3,
      title: 'Module de test',
    },
    {
      id: 3,
      title: 'Module de test',
    },
    {
      id: 3,
      title: 'Module de test',
    },
    {
      id: 3,
      title: 'Module de test',
    },
    {
      id: 3,
      title: 'Module de test',
    },
  ]
}