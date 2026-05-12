import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CalendarOptions} from '@fullcalendar/core';
import {FullCalendarModule} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import {EventService} from '../../shared/services/event.service';
import {EventCalendar} from '../../shared/models/event.model';
import {DatePipe} from '@angular/common';
import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {Chip} from 'primeng/chip';

@Component({
  selector: 'app-event-calendar',
  imports: [
    FullCalendarModule,
    DatePipe,
    Button,
    Tag,
    Dialog,
    PrimeTemplate,
    Chip
  ],
  templateUrl: './event-calendar.component.html',
  styleUrl: './event-calendar.component.scss'
})
export class EventCalendarComponent implements OnInit{

  protected readonly eventService = inject(EventService);
  protected readonly messageService = inject(MessageService);

  userEvents = signal<EventCalendar[]>([]);
  allEvents = signal<EventCalendar[]>([]);
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

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    firstDay: 1,
    customButtons:{
      seeAllEventsButton: {
        text: 'Ver todos los eventos',
        click: () => this.toggleView()
      }
    },
    headerToolbar: {
      left: 'title',
      right: 'prev,next today seeAllEventsButton'
    },
    buttonText: {
      today: 'Hoy',
      seeAllEventsButton: 'Ver'
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
    this.eventService.getEventsForCalendar()
    .subscribe({
      next: events => {
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
      }
    });
  }

  toggleView() {
    this.showingAllEvents.update(prev => !prev);
    this.updateCalendarEvents();
  }

  private updateCalendarEvents() {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.showingAllEvents() ? this.allEvents() : this.userEvents(),
      customButtons: {
        seeAllEventsButton: {
          text: this.showingAllEvents() ? 'Ver mis eventos' : 'Ver todos los eventos',
          click: () => this.toggleView()
        }
      }
    };
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
      .subscribe({
        next: () => {
          this.showModal.set(false);
          this.loadEvents();
          this.messageService.add({
            summary: "¡Te has inscrito correctamente al evento!",
            detail: "Acuérdate, la formación empieza el " + this.selectedEvent().start.toLocaleDateString(),
            severity: 'success',
          })
        },
        error: () => {
          this.messageService.add({
            text: "",
            severity: 'error',
          })
        }
      });
  }

  private getColor(educationStageCode: string | undefined) {
    switch (educationStageCode) {
      case 'AS': return 'var(--color-blue-500)';
      case 'ES': return 'var(--color-purple-600)';
      case 'CS': return 'var(--color-ecatlim)';
      default: return 'var(--color-green-600)';
    }
  }
}
