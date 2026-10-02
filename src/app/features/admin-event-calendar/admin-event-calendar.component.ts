import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { EventService } from '../../shared/services/event.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { map, tap } from 'rxjs';
import { Button } from 'primeng/button';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Menu } from 'primeng/menu';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';
import { LoggedUserDataService } from '../../core/auth/logged-user-data-service';
import { Role } from '../../shared/models/role.model';

@Component({
  selector: 'app-admin-event-calendar',
  imports: [
    FullCalendarModule,
    Button,
    DatePipe,
    UpperCasePipe,
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
  protected readonly loggedUserDataService = inject(LoggedUserDataService);

  /** Only the school director (Dirección ECATLIM) can publish events. */
  readonly canPublish = this.loggedUserDataService.hasAnyRole(Role.MANAGER_DIRECTOR);

  allEvents = signal<any[]>([]);
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
    const openEventId = this.route.snapshot.queryParamMap.get("openEventId");
    if (openEventId) {
      this.router.navigate(["detalle", openEventId], { relativeTo: this.route, replaceUrl: true });
    }
  }

  openEventDetails(event: any) {
    this.router.navigate(["detalle", event.id], { relativeTo: this.route });
  }

  handleEventClick(info: any) {
    this.router.navigate(["detalle", info.event.id], { relativeTo: this.route });
  }

  goToEditEvent(eventId: number) {
    this.router.navigate(['editar', eventId], { relativeTo: this.route });
  }

  goToCreateEvent() {
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
