import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {EducationStage, EducationStageCard} from '../models/education-stage.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EducationStageService {

  protected readonly http = inject(HttpClient);

  getEducationStages(): Observable<EducationStage[]>{
    return this.http.get<EducationStage[]>(`${environment.apiUrl}/education-stage/admin/all`)
  }

  createEducationStage(educationStageForm: EducationStage): Observable<any> {
    return this.http.post<Observable<any>>(`${environment.apiUrl}/education-stage/admin/add`, educationStageForm);
  }

  updateEducationStage(id: number, educationStageForm: EducationStage): Observable<EducationStage> {
    return this.http.put<EducationStage>(`${environment.apiUrl}/education-stage/admin/${id}`, educationStageForm);
  }

  getEducationStageWithModulesAndLessonBlocks(id: number) {
    return this.http.get<EducationStage>(`${environment.apiUrl}/education-stage/${id}`);
  }

  getEducationOffer(): Observable<EducationStageCard[]> {
    return this.http.get<EducationStageCard[]>(`${environment.apiUrl}/education-stage/offer`);
  }
}
