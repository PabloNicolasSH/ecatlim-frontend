import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ScoutGroup} from '../../models/scout-group.model';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScoutGroupService {

  protected readonly http = inject(HttpClient);

  getScoutGroups(): Observable<ScoutGroup[]>{
    return this.http.get<ScoutGroup[]>(`${environment.apiUrl}/scout-group/all`)
  }
}
