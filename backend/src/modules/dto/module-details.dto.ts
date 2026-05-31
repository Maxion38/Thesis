export class ModuleDetailsDto {
    id!: number;
    name!: string;
    description!: string;
    groups!: ModuleToolGroupDto[];
}

export interface ModuleToolGroupDto {
  id: number;
  label?: string;
  type: 'WORK' | 'FORM' | 'ACTIVITY' | 'ASSESSMENT';
  state: 'UNTOUCHED' | 'SUBMITTED' | 'CORRECTED'; 
  date?: Date;
}
