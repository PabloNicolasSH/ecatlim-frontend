import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Event, EventForm} from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  protected readonly http = inject(HttpClient);

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${environment.apiUrl}/events/${id}`);
  }

  enroll(eventId: number): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/events/${eventId}/enroll`, {});
  }

  saveEvent(event: EventForm): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/events/admin/add`, event);
  }
}
