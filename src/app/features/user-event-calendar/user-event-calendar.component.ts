import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventService } from '../../shared/services/event.service';
import { UserEventCalendar } from '../../shared/models/event.model';
import { DatePipe } from '@angular/common';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ActivatedRoute, Router } from '@angular/router';
import { map, tap } from 'rxjs';

@Component({
  selector: 'app-user-event-calendar',
  imports: [
    FullCalendarModule,
    DatePipe,
    Button,
    Tag
  ],
  templateUrl: './user-event-calendar.component.html',
  styleUrl: './user-event-calendar.component.scss'
})
export class UserEventCalendarComponent implements OnInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  protected readonly eventService = inject(EventService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  userEvents = signal<UserEventCalendar[]>([]);
  allEvents = signal<UserEventCalendar[]>([]);
  showingAllEvents = signal(false);

  upcomingEvents = computed(() => {
    const events = this.showingAllEvents() ? this.allEvents() : this.userEvents();
    return [...events]
      .filter(e => new Date(e.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    firstDay: 1,
    headerToolbar: {
      left: 'title',
      right: 'prev,next today'
    },
    buttonText: {
      today: 'Hoy'
    },
    events: [],
    eventClick: (info) => this.goToEvent(info.event.id),
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    locale: 'es',
    height: 'auto',
  };

  ngOnInit(): void {
    const openEvent = this.route.snapshot.queryParamMap.get('openEvent');
    if (openEvent) {
      this.router.navigate(['evento', openEvent], { relativeTo: this.route, replaceUrl: true });
      return;
    }
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getUserEventsForCalendar()
      .pipe(
        map(events => events.map(event => ({
          ...event,
          id: event.id?.toString(),
          start: event.startDate,
          end: event.endDate,
          classNames: event.isCurrentUserAttending ? ['event-enrolled'] : [],
          title: event.isCurrentUserAttending ? `✓ ${event.title}` : event.title,
          backgroundColor: this.getColor(event.educationStageCode),
          borderColor: this.getColor(event.educationStageCode)
        }))),
        tap(mappedEvents => {
          this.allEvents.set(mappedEvents);
          this.userEvents.set(mappedEvents.filter(e => e.isCurrentUserAttending || e.canParticipate));

          this.calendarOptions = {
            ...this.calendarOptions,
            events: this.userEvents()
          };
        })
      )
      .subscribe();
  }

  toggleView() {
    this.showingAllEvents.update(prev => !prev);
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.showingAllEvents() ? this.allEvents() : this.userEvents()
    };
  }

  openEventDetails(event: { id?: string }) {
    this.goToEvent(event.id);
  }

  private goToEvent(eventId: string | number | undefined) {
    if (eventId === undefined) return;
    this.router.navigate(['evento', eventId], { relativeTo: this.route });
  }

  getColor(educationStageCode: string | undefined) {
    switch (educationStageCode) {
      case 'AS': return 'var(--color-blue-500)';
      case 'ES': return 'var(--color-purple-600)';
      case 'CS': return 'var(--color-ecatlim)';
      default: return 'var(--color-green-600)';
    }
  }
}
