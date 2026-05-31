export class ModuleDetailsModel {
    id!: number;
    name!: string;
    description!: string;
    groups!: ModuleToolGroupModel[];
}

export interface ModuleToolGroupModel {
  id: number;
  label?: string;
  type: 'WORK' | 'FORM' | 'ACTIVITY' | 'ASSESSMENT';
  state: 'UNTOUCHED' | 'SUBMITTED' | 'CORRECTED'; 
  date?: Date;
}
