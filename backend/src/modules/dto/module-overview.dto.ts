export class ModuleOverviewDto {
  id!: number;
  name!: string;

  status!: ModuleStatusDto;
  groups!: ModuleToolGroupDto[];
}

export interface ModuleStatusDto {
    locked: boolean
    lockedBy?: ConditionDto[]
}

export interface ConditionDto {
  id: number;
  method: 'USER_VALIDATION' | 'SUPERVISOR_VALIDATION' | 'TOOL_SUBMISSION' | 'DATE';
  date?: Date;
  validatorName?: string;
  toolName?: string;
}

export interface ModuleToolGroupDto {
  id: number;
  label?: string;
  type: 'WORK' | 'FORM' | 'ACTIVITY' | 'ASSESSMENT';
  state: 'UNTOUCHED' | 'SUBMITTED' | 'CORRECTED'; 
  date?: Date;
}
