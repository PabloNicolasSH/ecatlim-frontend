import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ScoutGroup} from '../models/scout-group.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntityService {

  protected readonly http = inject(HttpClient);

  getEntities(): Observable<ScoutGroup[]>{
    return this.http.get<ScoutGroup[]>(`${environment.apiUrl}/scout-group/all`)
  }

  addEntity(scoutGroup: ScoutGroup) {
    return this.http.post<ScoutGroup>(`${environment.apiUrl}/scout-group/add`, scoutGroup);
  }

  updateEntity(id: number, payload: ScoutGroup) {
    return this.http.put<ScoutGroup>(`${environment.apiUrl}/scout-group/${id}/update`, payload);
  }

  deleteEntity(id: number) {
    return this.http.delete<ScoutGroup>(`${environment.apiUrl}/scout-group/${id}/delete`);
  }
}
