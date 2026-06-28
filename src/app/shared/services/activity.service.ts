import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  protected readonly http = inject(HttpClient);

  getActivitiesByEvent(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/activity/event/${eventId}`);
  }

  createActivity(eventId: number, activityData: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/activity/event/${eventId}`, activityData);
  }

  getForumPublications(activityId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/activity/${activityId}/publications`);
  }

  publishInForum(activityId: number, studentId: number, body: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/activity/${activityId}/publish?studentId=${studentId}`, body);
  }

  submitSurvey(activityId: number, studentId: number, responses: any[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/${activityId}/survey-submit?studentId=${studentId}`, responses);
  }

  uploadSubmissionFile(activityId: number, studentId: number, formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/${activityId}/upload-file?studentId=${studentId}`, formData);
  }
}
