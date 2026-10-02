import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {EducationStageCard} from '../models/education-stage.model';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Enrollment, EnrollmentDocuments, EnrollmentDocumentType} from '../models/enrollment.model';
import {AttendedEvent, Event, EventForm} from '../models/event.model';

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

  getAttendedEvents(stageId: number): Observable<AttendedEvent[]> {
    return this.http.get<AttendedEvent[]>(`${environment.apiUrl}/enrollments/stages/${stageId}/attended-events`);
  }

  uploadDocument(enrollmentId: number, type: EnrollmentDocumentType, file: File): Observable<EnrollmentDocuments> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EnrollmentDocuments>(
      `${environment.apiUrl}/enrollments/stages/${enrollmentId}/documents/${type}`, formData);
  }

  downloadDocument(fileId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/users/me/files/${fileId}`, {responseType: 'blob'});
  }

  enrollInEvent(eventId: number, lessonBlockIds: number[]): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/enrollments/events/${eventId}/enroll`, lessonBlockIds);
  }

  unenrollInEvent(eventId: number, lessonBlockIds: number[]): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/enrollments/events/${eventId}/unenroll`, lessonBlockIds);
  }
}
