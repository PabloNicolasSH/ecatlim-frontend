import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  protected readonly http = inject(HttpClient);

  createActivity(eventId: number, activityData: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/event/${eventId}`, activityData);
  }
}
