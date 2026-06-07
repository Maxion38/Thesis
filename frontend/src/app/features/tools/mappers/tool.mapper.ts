import { ToolModel } from '../models/tool.model';

export function mapTool(dto: any): ToolModel {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    type: dto.type,
    moduleId: dto.moduleId,
  };
}

export function mapTools(dtos: any[]): ToolModel[] {
  return dtos.map(mapTool);
}