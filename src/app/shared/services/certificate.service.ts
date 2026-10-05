import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Enrollment, EnrollmentDocuments} from '../models/enrollment.model';

export interface AttendanceSummary {
  events: number;
  lessonBlocks: number;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  protected readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/certificates`;

  downloadBlockCertificate(lessonBlockId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/blocks/${lessonBlockId}/download`, {responseType: 'blob'});
  }

  getUserProgress(userId: number): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.baseUrl}/users/${userId}/progress`);
  }

  sendAttendanceCertificate(userId: number, stageId?: number): Observable<AttendanceSummary> {
    const query = stageId == null ? '' : `?stageId=${stageId}`;
    return this.http.post<AttendanceSummary>(`${this.baseUrl}/users/${userId}/attendance/send${query}`, {});
  }

  setBlockPassed(userId: number, lessonBlockId: number, passed: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/${userId}/blocks/${lessonBlockId}/passed`, {passed});
  }

  sendBlockCertificates(userId: number, lessonBlockIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${userId}/blocks/send`, {lessonBlockIds});
  }

  uploadStageCertificate(enrollmentId: number, file: File): Observable<EnrollmentDocuments> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EnrollmentDocuments>(`${this.baseUrl}/stages/${enrollmentId}/certificate`, formData);
  }

  completeStage(enrollmentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/stages/${enrollmentId}/complete`, {});
  }

  sendStageCertificate(enrollmentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/stages/${enrollmentId}/send`, {});
  }
}
