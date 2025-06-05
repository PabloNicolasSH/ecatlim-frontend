import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {ModuleModel} from '../../models/module.model';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {

  protected readonly http = inject(HttpClient);

  createModules(modulesToSend: ModuleModel[]) {
    return this.http.post(`${environment.apiUrl}/module/admin/create-modules`, modulesToSend);
  }

  getAll() {
    return this.http.get<ModuleModel[]>(`${environment.apiUrl}/module/admin/all`);
  }
}
