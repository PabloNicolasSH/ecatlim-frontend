import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {EducationStageCard} from '../models/education-stage.model';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Enrollment} from '../models/enrollment.model';
import {Event, EventForm} from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {

  protected readonly http = inject(HttpClient);

  enrollInStage(stageId: number): Observable<EducationStageCard> {
    return this.http.post<EducationStageCard>(`${environment.apiUrl}/enrollments/stages/${stageId}/enroll`, {});
  }

  getUserProgress(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${environment.apiUrl}/enrollments/stages/my-progress`);
  }

  enrollInEvent(eventId: number, lessonBlockIds: number[]): Observable<Event> {
    return this.http.put<Event>(`${environment.apiUrl}/enrollments/events/${eventId}/enroll`, lessonBlockIds);
  }

  unenrollInEvent(eventId: number, lessonBlockIds: number[]): Observable<Event> {
    return this.http.put<Event>(`${environment.apiUrl}/enrollments/events/${eventId}/unenroll`, lessonBlockIds);
  }
}
