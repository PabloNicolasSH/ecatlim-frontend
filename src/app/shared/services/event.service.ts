import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {
  AdminEventCalendar,
  AttendanceType,
  Event,
  EventDashboard,
  EventDetail,
  EventForm,
  EventSuggestions,
  UserEventCalendar
} from '../models/event.model';
import {LessonBlock} from '../models/lesson-block.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  protected readonly http = inject(HttpClient);

  getEventDetail(id: number): Observable<EventDetail> {
    return this.http.get<EventDetail>(`${environment.apiUrl}/events/${id}/detail`);
  }

  markAttendance(eventId: number, userId: number, lessonBlockId: number, attendance: AttendanceType | null): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/events/${eventId}/attendance`, {userId, lessonBlockId, attendance});
  }

  getSuggestions(): Observable<EventSuggestions> {
    return this.http.get<EventSuggestions>(`${environment.apiUrl}/events/suggestions`);
  }

  getEventFormById(id: number): Observable<EventForm> {
    return this.http.get<EventForm>(`${environment.apiUrl}/events/edit/${id}`);
  }

  getEventBlocks(id: number): Observable<LessonBlock[]> {
    return this.http.get<LessonBlock[]>(`${environment.apiUrl}/events/${id}/lesson-blocks`);
  }

  getUserEventsForCalendar(): Observable<UserEventCalendar[]> {
    return this.http.get<UserEventCalendar[]>(`${environment.apiUrl}/events/user-calendar`);
  }

  getAdminEventsForCalendar(): Observable<AdminEventCalendar[]> {
    return this.http.get<AdminEventCalendar[]>(`${environment.apiUrl}/events/calendar`);
  }

  getEventsForHome(): Observable<EventDashboard[]> {
    return this.http.get<EventDashboard[]>(`${environment.apiUrl}/events/user-home`);
  }

  saveEvent(event: EventForm): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/events/add`, event);
  }

  updateEvent(eventId: number, eventDto: EventForm) {
    return this.http.put<Event>(`${environment.apiUrl}/events/${eventId}`, eventDto);
  }

  setPending(id: number) {
    return this.http.put<Event>(`${environment.apiUrl}/events/${id}/set-pending`, null);
  }

  updateStatus(id: number, status: string) {
    return this.http.put<Event>(`${environment.apiUrl}/events/update-status/${id}`, status);
  }

  delete(id: number) {
    return this.http.delete<Event>(`${environment.apiUrl}/events/${id}`);
  }
}
