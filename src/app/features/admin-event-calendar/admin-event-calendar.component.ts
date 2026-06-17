import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
import {Dialog} from 'primeng/dialog';
import {FullCalendarComponent, FullCalendarModule} from '@fullcalendar/angular';
import {EventService} from '../../shared/services/event.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CalendarOptions} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import {map, tap} from 'rxjs';
import {Button} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {CurrencyPipe, DatePipe, NgClass, UpperCasePipe} from '@angular/common';
import {Tag} from 'primeng/tag';

@Component({
  selector: 'app-admin-event-calendar',
  imports: [
    Dialog,
    FullCalendarModule,
    Button,
    TableModule,
    DatePipe,
    CurrencyPipe,
    Tag,
    UpperCasePipe,
    NgClass
  ],
  templateUrl: './admin-event-calendar.component.html',
  styleUrl: './admin-event-calendar.component.scss'
})
export class AdminEventCalendarComponent implements OnInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  protected readonly eventService = inject(EventService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  allEvents = signal<any[]>([]);
  showModal = signal(false);
  selectedEvent = signal<any>(null);

  upcomingEvents = computed(() => {
    return [...this.allEvents()]
      .filter(e => new Date(e.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  isMultiDay = computed(() => {
    const event = this.selectedEvent();
    if (!event || !event.start || !event.end) return false;

    const start = new Date(event.start);
    const end = new Date(event.end);

    return start.toDateString() !== end.toDateString();
  });

  uniqueAttendeesCount = computed(() => {
    const uniqueEmails = new Set<string>();

    this.upcomingEvents().forEach(event => {
      if (event.attendees && Array.isArray(event.attendees)) {
        event.attendees.forEach((student: any) => {
          if (student.email) uniqueEmails.add(student.email.trim().toLowerCase());
        });
      }
    });

    return uniqueEmails.size;
  });

  publishedUpcomingCoursesCount = computed(() => {
    return this.upcomingEvents().filter(event => event.status === 'PUBLISHED').length;
  });

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    firstDay: 1,
    headerToolbar: { left: 'title', right: 'prev,next today' },
    buttonText: { today: 'Hoy' },
    events: [],
    eventClick: (info) => this.handleEventClick(info),
    locale: 'es',
    height: 'auto',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
  };

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEventsForCalendar()
      .pipe(
        map(events => events.map(event => {
          const statusColor = this.getStatusColor(event.status!);
          return {
            ...event,
            id: event.id?.toString(),
            start: event.startDate,
            end: event.endDate,
            isCurrentUserDirector: true,
            title: event.title,
            backgroundColor: statusColor.bg,
            borderColor: statusColor.border,
            textColor: statusColor.text
          };
        })),
        tap(mappedEvents => {
          this.allEvents.set(mappedEvents);
          this.calendarOptions = { ...this.calendarOptions, events: this.allEvents() };
        })
      ).subscribe();
  }

  openEventDetails(event: any) {
    this.selectedEvent.set({ ...event, start: event.startDate, end: event.endDate });
    this.showModal.set(true);
    if (this.calendarComponent) {
      this.calendarComponent.getApi().gotoDate(event.startDate);
    }
  }

  handleEventClick(info: any) {
    const rawEvent = this.allEvents().find(e => e.id === info.event.id);
    this.selectedEvent.set({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...rawEvent
    });
    this.showModal.set(true);
  }

  goToEditScheduler(eventId: number) {
    this.showModal.set(false);
    this.router.navigate(['/app/admin/eventos-formativos/crear-evento', eventId]);
  }

  goToCreateEvent() {
    this.router.navigate(['/app/admin/eventos-formativos/crear-evento']);
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'PUBLISHED':
        return { bg: '#e6f4ea', border: '#34a853', text: '#137333', label: 'PUBLICADO', severity: 'success' };
      case 'PENDING':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', label: 'PENDIENTE', severity: 'warn' };
      case 'DRAFT':
      default:
        return { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563', label: 'BORRADOR', severity: 'secondary' };
    }
  }

  getPaymentTagSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status?.toUpperCase()) {
      case 'PAGADO': return 'success';
      case 'PENDIENTE': return 'warn';
      case 'VENCIDO': return 'danger';
      default: return 'secondary';
    }
  }
}
