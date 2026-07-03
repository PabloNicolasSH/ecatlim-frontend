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

  publishInForum(activityId: number, body: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/activity/${activityId}/forum-publications`, body);
  }

  submitSurvey(activityId: number, studentId: number, responses: any[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/activity/${activityId}/survey-responses?studentId=${studentId}`, responses);
  }

  uploadSubmissionFile(activityId: number, studentId: number, formData: FormData, comment?: string): Observable<any> {
    let url = `${environment.apiUrl}/activity/${activityId}/file-submissions?studentId=${studentId}`;
    if (comment) {
      url += `&comment=${encodeURIComponent(comment)}`;
    }
    return this.http.post(url, formData);
  }
}
