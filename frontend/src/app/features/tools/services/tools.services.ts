import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ToolModel } from '../models/tool.model';
import { mapTool, mapTools } from '../mappers/tool.mapper';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ToolService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/tools`;

  getToolsByModuleId(moduleId: number): Observable<ToolModel[]> {
    return this.http
      .get<ToolModel[]>(`${this.apiUrl}/module/${moduleId}`, {
        withCredentials: true,
      })
      .pipe(map(mapTools));
  }

  updateTool(toolId: number, dto: { name?: string; description?: string }): Observable<ToolModel> {
    return this.http
      .patch<ToolModel>(`${this.apiUrl}/${toolId}`, dto, {
        withCredentials: true,
      })
      .pipe(map(mapTool));
  }

  deleteTool(toolId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${toolId}`, {
      withCredentials: true
    });
  }
}