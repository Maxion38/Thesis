export class ModuleOverviewModel {
  id!: number;
  name!: string;

  status!: ModuleStatusModel;
  groups!: ModuleToolGroupModel[];
}

export interface ModuleStatusModel {
    locked: boolean
    lockedBy?: ConditionModel[]
}

export interface ConditionModel {
  id: number;
  method: 'USER_VALIDATION' | 'SUPERVISOR_VALIDATION' | 'TOOL_SUBMISSION' | 'DATE';
  date?: Date;
  validatorName?: string;
  toolName?: string;
}

export interface ModuleToolGroupModel {
  id: number;
  label?: string;
  type: 'WORK' | 'FORM' | 'ACTIVITY' | 'ASSESSMENT';
  state: 'UNTOUCHED' | 'SUBMITTED' | 'CORRECTED'; 
  date?: Date;
}