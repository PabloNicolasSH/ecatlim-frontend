import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {EducationStageCard} from '../models/education-stage.model';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Enrollment} from '../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {

  protected readonly http = inject(HttpClient);

  enrollInStage(stageId: number): Observable<EducationStageCard> {
    return this.http.post<EducationStageCard>(`${environment.apiUrl}/enrollments/${stageId}/enroll`, {});
  }

  getUserProgress(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${environment.apiUrl}/enrollments/my-progress`);
  }
}
