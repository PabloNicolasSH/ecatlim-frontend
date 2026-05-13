import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Event, EventCalendar, EventDashboard, EventForm} from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  protected readonly http = inject(HttpClient);

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${environment.apiUrl}/events/${id}`);
  }

  getEventsForCalendar(): Observable<EventCalendar[]> {
    return this.http.get<EventCalendar[]>(`${environment.apiUrl}/events/user-calendar`);
  }

  getEventsForHome(): Observable<EventDashboard[]> {
    return this.http.get<EventDashboard[]>(`${environment.apiUrl}/events/user-home`);
  }

  enroll(eventId: number): Observable<Event> {
    return this.http.put<Event>(`${environment.apiUrl}/events/${eventId}/enroll`, {});
  }

  saveEvent(event: EventForm): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/events/admin/add`, event);
  }
}
