import { ModuleDetailsModel } from "../model/module-details.model";

export function mapModuleDetails(dto: any): ModuleDetailsModel {
  return { ...dto };
}