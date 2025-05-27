import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {EducationStage} from '../models/education-stage.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EducationStageService {

  protected readonly http = inject(HttpClient);

  getEducationStages(): Observable<EducationStage[]>{
    return this.http.get<EducationStage[]>(`${environment.apiUrl}/education-stage/admin/all`)
  }
}
