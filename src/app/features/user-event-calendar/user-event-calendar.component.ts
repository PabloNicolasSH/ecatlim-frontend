import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CalendarOptions} from '@fullcalendar/core';
import {FullCalendarComponent, FullCalendarModule} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import {EventService} from '../../shared/services/event.service';
import {UserEventCalendar} from '../../shared/models/event.model';
import {DatePipe} from '@angular/common';
import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {Chip} from 'primeng/chip';
import {ActivatedRoute, Router} from '@angular/router';
import {map, switchMap, tap} from 'rxjs';
import {TabPanel, TabView} from 'primeng/tabview';

@Component({
  selector: 'app-user-event-calendar',
  imports: [
    FullCalendarModule,
    DatePipe,
    Button,
    Tag,
    Dialog,
    PrimeTemplate,
    Chip,
    TabView,
    TabPanel
  ],
  templateUrl: './user-event-calendar.component.html',
  styleUrl: './user-event-calendar.component.scss'
})
export class UserEventCalendarComponent implements OnInit{

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  protected readonly eventService = inject(EventService);
  protected readonly messageService = inject(MessageService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  userEvents = signal<UserEventCalendar[]>([]);
  allEvents = signal<UserEventCalendar[]>([]);
  showingAllEvents = signal(false);
  showModal = signal(false);
  selectedEvent = signal<any>(null);

  isMultiDay = computed(() => {
    const event = this.selectedEvent();
    if (!event) return false;

    const start = new Date(event.start);
    const end = new Date(event.end);

    return start.toDateString() !== end.toDateString();
  });

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
    eventClick: (info) => this.handleEventClick(info),
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
        }),
        tap(() => {
          this.route.queryParams.subscribe(params => {
            const eventId = params['openEvent'];
            if (eventId) {
              this.openQueryEvent(eventId);
            }
          });
        })
      )
      .subscribe();
  }

  toggleView() {
    this.showingAllEvents.update(prev => !prev);
    this.updateCalendarEvents();
  }

  private updateCalendarEvents() {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.showingAllEvents() ? this.allEvents() : this.userEvents()
    };
  }

  openEventDetails(event: any) {
    this.handleEventClick({ event: {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: { ...event }
      }});

    const calendarApi = this.calendarComponent.getApi();
    calendarApi.gotoDate(event.start);
  }

  private openQueryEvent(eventId: any) {
    const event: any = this.userEvents().find(e => e.id == eventId);

    if (!event) return;

    this.selectedEvent.set({
      id: Number(event.id),
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      description: event.description,
      contents: event.contents,
      location: event.location,
      organizer: event.organizer,
      educationStageCode: event.educationStageCode,
      lessonBlocks: event.lessonBlocks,
      attendeesCount: event.attendeesCount,
      canParticipate: event.canParticipate,
      isCurrentUserAttending: event.isCurrentUserAttending
    });
    this.showModal.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openEvent: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  handleEventClick(info: any) {
    this.selectedEvent.set({
      id: Number(info.event.id),
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps
    });
    this.showModal.set(true);
  }

  registerToEvent(eventId: number) {
    this.eventService.enroll(eventId)
      .pipe(
        tap(() => {
          this.messageService.add({
            summary: "¡Te has inscrito correctamente al evento!",
            detail: "Acuérdate de revisar los detalles en tu calendario.",
            severity: 'success',
          });
        }),
        switchMap(() => this.eventService.getUserEventsForCalendar()),
        tap(events => {
          const mappedEvents = events.map(event => ({
            ...event,
            id: event.id?.toString(),
            start: event.startDate,
            end: event.endDate,
            classNames: event.isCurrentUserAttending ? ['event-enrolled'] : [],
            title: event.isCurrentUserAttending ? `✓ ${event.title}` : event.title,
            backgroundColor: this.getColor(event.educationStageCode),
            borderColor: this.getColor(event.educationStageCode)
          }));

          this.allEvents.set(mappedEvents);
          this.userEvents.set(mappedEvents.filter(e => e.isCurrentUserAttending || e.canParticipate));

          this.calendarOptions = {
            ...this.calendarOptions,
            events: this.userEvents()
          };

          const updatedEvent = mappedEvents.find(e => e.id == eventId.toString());
          if (updatedEvent) {
            this.selectedEvent.set({
              ...updatedEvent,
              id: Number(updatedEvent.id)
            });
          }
        })
      )
      .subscribe({
        error: (err) => {
          this.messageService.add({
            summary: "Error al inscribirse",
            detail: "No se pudo completar la inscripción.",
            severity: 'error',
          });
        }
      });
  }

  unregisterFromEvent(eventId: number) {
    this.eventService.unenroll(eventId)
      .pipe(
        tap(() => {
          this.messageService.add({
            summary: "Te has desinscrito correctamente del evento",
            severity: 'success',
          });
        }),
        switchMap(() => this.eventService.getUserEventsForCalendar()),
        tap(events => {
          const mappedEvents = events.map(event => ({
            ...event,
            id: event.id?.toString(),
            start: event.startDate,
            end: event.endDate,
            classNames: event.isCurrentUserAttending ? ['event-enrolled'] : [],
            title: event.isCurrentUserAttending ? `✓ ${event.title}` : event.title,
            backgroundColor: this.getColor(event.educationStageCode),
            borderColor: this.getColor(event.educationStageCode)
          }));

          this.allEvents.set(mappedEvents);
          this.userEvents.set(mappedEvents.filter(e => e.isCurrentUserAttending || e.canParticipate));

          this.calendarOptions = {
            ...this.calendarOptions,
            events: this.userEvents()
          };

          const updatedEvent = mappedEvents.find(e => e.id == eventId.toString());
          if (updatedEvent) {
            this.selectedEvent.set({
              ...updatedEvent,
              id: Number(updatedEvent.id)
            });
          }
        })
      )
      .subscribe({
        error: (err) => {
          this.messageService.add({
            summary: "Error al desinscribirse",
            detail: "No se pudo completar la acción.",
            severity: 'error',
          });
        }
      });
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
