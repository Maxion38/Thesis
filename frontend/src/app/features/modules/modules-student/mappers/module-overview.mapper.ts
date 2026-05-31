import { ModuleOverviewModel } from "../model/module-overview.model";

export function mapModuleOverview(dto: any): ModuleOverviewModel {
  return { ...dto };
}