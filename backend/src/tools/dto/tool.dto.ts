export class ToolDto {
  id!: number;
  name!: string;
  description!: string | null;
  type!: string;
  moduleId!: number;
  linkedToolId?: number | null;
}