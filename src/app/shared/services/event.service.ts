import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Event, UserEventCalendar, EventDashboard, EventForm, AdminEventCalendar} from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  protected readonly http = inject(HttpClient);

  getEventFormById(id: number): Observable<EventForm> {
    return this.http.get<EventForm>(`${environment.apiUrl}/events/edit/${id}`);
  }

  getUserEventsForCalendar(): Observable<UserEventCalendar[]> {
    return this.http.get<UserEventCalendar[]>(`${environment.apiUrl}/events/user-calendar`);
  }

  getAdminEventsForCalendar(): Observable<AdminEventCalendar[]> {
    return this.http.get<AdminEventCalendar[]>(`${environment.apiUrl}/events/admin/calendar`);
  }

  getEventsForHome(): Observable<EventDashboard[]> {
    return this.http.get<EventDashboard[]>(`${environment.apiUrl}/events/user-home`);
  }

  saveEvent(event: EventForm): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/events/admin/add`, event);
  }

  updateEvent(eventId: number, eventDto: EventForm) {
    return this.http.put<Event>(`${environment.apiUrl}/events/admin/${eventId}`, eventDto);
  }

  updateStatus(id: number, status: string) {
    return this.http.put<Event>(`${environment.apiUrl}/events/admin/update-status/${id}`, status);
  }

  delete(id: number) {
    return this.http.delete<Event>(`${environment.apiUrl}/events/${id}`);
  }
}
