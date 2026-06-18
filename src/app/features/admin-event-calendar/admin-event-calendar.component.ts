import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { EventService } from '../../shared/services/event.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { map, tap } from 'rxjs';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CurrencyPipe, DatePipe, NgClass, UpperCasePipe } from '@angular/common';
import { Menu } from 'primeng/menu';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';

@Component({
  selector: 'app-admin-event-calendar',
  imports: [
    Dialog,
    FullCalendarModule,
    Button,
    TableModule,
    DatePipe,
    CurrencyPipe,
    UpperCasePipe,
    NgClass,
    Menu,
    ConfirmDialog
  ],
  templateUrl: './admin-event-calendar.component.html',
  styleUrl: './admin-event-calendar.component.scss'
})
export class AdminEventCalendarComponent implements OnInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @ViewChild('menu') menuComponent!: Menu;

  protected readonly eventService = inject(EventService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly messageService = inject(MessageService);

  allEvents = signal<any[]>([]);
  showModal = signal(false);
  selectedEvent = signal<any>(null);

  menuContextEvent: any = null;
  menuItems: MenuItem[] = [
    {
      label: 'Ver Detalle',
      icon: 'pi pi-eye',
      command: () => this.openEventDetails(this.menuContextEvent)
    },
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => this.goToEditEvent(this.menuContextEvent.id)
    }
  ];

  upcomingEvents = computed(() => {
    return [...this.allEvents()]
      .filter(e => e.startDate && new Date(e.startDate) >= new Date())
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
      if (event.students && Array.isArray(event.students)) {
        event.students.forEach((student: any) => {
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
    this.eventService.getAdminEventsForCalendar()
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
          this.checkQueryParams();
        })
      ).subscribe();
  }

  private checkQueryParams() {
    const openEventId = this.route.snapshot.queryParamMap.get('openEventId');
    if (openEventId) {
      const eventToOpen = this.allEvents().find(e => e.id === openEventId);
      if (eventToOpen) {
        this.clearModalData();
        this.openEventDetails(eventToOpen);
        this.clearQueryParam();
      }
    }
  }

  private clearQueryParam() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openEventId: null },
      queryParamsHandling: 'merge'
    });
  }

  clearModalData() {
    this.showModal.set(false);
    this.selectedEvent.set(null);
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
    this.clearModalData();
    this.selectedEvent.set({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...rawEvent
    });
    this.showModal.set(true);
  }

  goToEditEvent(eventId: number) {
    this.clearModalData();
    this.router.navigate(['editar', eventId], { relativeTo: this.route });
  }

  goToCreateEvent() {
    this.clearModalData();
    this.router.navigate(['crear-evento'], { relativeTo: this.route });
  }

  publishEvent(event: any) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas publicar el evento "${event.title}"?`,
      header: 'Confirmar Publicación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, publicar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning text-sm',
      rejectButtonStyleClass: 'p-button-text text-sm',
      accept: () => {
        this.eventService.updateStatus(event.id, "PUBLISHED").subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Evento publicado',
              detail: `El evento "${event.title}" ahora está visible para todos.`
            });
            this.loadEvents();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo publicar el evento.'
            });
          }
        });
      }
    });
  }

  openMenu(eventClick: Event, eventItem: any) {
    this.menuContextEvent = eventItem;
    this.menuComponent.toggle(eventClick);
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
