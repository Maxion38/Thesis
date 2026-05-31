import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ToolModel } from '../models/tool.model';
import { mapTools } from '../mappers/tool.mapper';

@Injectable({
  providedIn: 'root',
})
export class ToolService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/tools';

  getToolsByModuleId(moduleId: number): Observable<ToolModel[]> {
    return this.http
      .get<ToolModel[]>(`${this.apiUrl}/module/${moduleId}`, {
        withCredentials: true,
      })
      .pipe(map(mapTools));
  }
}