import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SimpleUser} from '../models/user.model';
import {RecognitionDecision, RecognitionRequest, RecognitionStatus, RecognitionType} from '../models/recognition.model';

@Injectable({
  providedIn: 'root'
})
export class RecognitionService {

  protected readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/recognitions`;

  getMine(): Observable<RecognitionRequest[]> {
    return this.http.get<RecognitionRequest[]>(`${this.baseUrl}/mine`);
  }

  open(lessonBlockId: number, type: RecognitionType, comment: string, files: File[]): Observable<RecognitionRequest> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify({type, comment})], {type: 'application/json'}));
    files.forEach(file => formData.append('files', file));
    return this.http.post<RecognitionRequest>(`${this.baseUrl}/blocks/${lessonBlockId}`, formData);
  }

  addDocumentation(requestId: number, comment: string, files: File[]): Observable<RecognitionRequest> {
    const formData = new FormData();
    formData.append('comment', comment);
    files.forEach(file => formData.append('files', file));
    return this.http.post<RecognitionRequest>(`${this.baseUrl}/${requestId}/documents`, formData);
  }

  getForReview(statuses?: RecognitionStatus[]): Observable<RecognitionRequest[]> {
    const query = statuses?.length ? `?status=${statuses.join(',')}` : '';
    return this.http.get<RecognitionRequest[]>(`${this.baseUrl}/admin${query}`);
  }

  getCommissionCandidates(): Observable<SimpleUser[]> {
    return this.http.get<SimpleUser[]>(`${this.baseUrl}/admin/commission-candidates`);
  }

  assignCommission(requestId: number, userIds: number[]): Observable<RecognitionRequest> {
    return this.http.put<RecognitionRequest>(`${this.baseUrl}/admin/${requestId}/commission`, {userIds});
  }

  respond(requestId: number, decision: RecognitionDecision, comment: string): Observable<RecognitionRequest> {
    return this.http.post<RecognitionRequest>(`${this.baseUrl}/admin/${requestId}/respond`, {decision, comment});
  }

  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/users/me/files/${fileId}`, {responseType: 'blob'});
  }
}
