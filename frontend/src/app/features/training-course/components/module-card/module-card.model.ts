export interface ModuleCard {
  title: string;
  accessConditions?: Condition[];
  successConditions?: Condition[];
  id: number;
}

export interface Condition {
  method: 'uservalidation' | 'supervisorvalidation' | 'toolsubmission' | 'date';
  value: string | string | string | Date;
}