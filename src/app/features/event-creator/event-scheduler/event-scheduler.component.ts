import {AfterViewInit, Component, EventEmitter, inject, Input, Output, ViewChild} from '@angular/core';
import {CalendarOptions} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, {Draggable} from '@fullcalendar/interaction'
import {FullCalendarComponent, FullCalendarModule} from '@fullcalendar/angular';
import {DatePipe, JsonPipe} from '@angular/common';
import {ProgressBar} from 'primeng/progressbar';
import {Button} from 'primeng/button';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {HoursPipe} from '../../../shared/pipes/hours.pipe';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-event-scheduler',
  imports: [
    FullCalendarModule,
    JsonPipe,
    ProgressBar,
    Button,
    DatePipe,
    HoursPipe,
    Dialog,
    InputText,
    PrimeTemplate,
    Textarea,
    FormsModule
  ],
  templateUrl: './event-scheduler.component.html',
  styleUrl: './event-scheduler.component.scss'
})
export class EventSchedulerComponent implements AfterViewInit{
  @Input() basicInfo: any;
  @Input() pendingBlocks: any[] = [];
  @Output() onBack = new EventEmitter<void>();
  @ViewChild('calendar') fullCalendar!: FullCalendarComponent;

  protected readonly messageService = inject(MessageService);

  displayModal: boolean = false;
  selectedEvent: any = null;
  tempSessionData = { title: '', description: '' };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    droppable: true,
    editable: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '24:00:00',
    allDaySlot: false,
    locale: 'es',
    firstDay: 1,
    customButtons: {
      goToStart: {
        text: "Inicio del Evento",
        click: () => {
          this.resetToStartDate();
        }
      }
    },
    headerToolbar: { left: 'prev,next goToStart', center: 'title', right: 'timeGridDay,timeGridWeek' },
    eventClick: (info) => this.handleEventClick(info),
    eventReceive: (info) => this.handleEventReceive(info),
    eventResize: (info) => this.handleEventChange(info),
    eventDrop: (info) => this.handleEventChange(info)
  };


  ngOnInit() {
    this.pendingBlocks.forEach(b => {
      if (!b.color) b.color = this.getRandomColor();
    });

    if (this.basicInfo.startDate) {
      this.calendarOptions.initialDate = this.basicInfo.startDate;
    }
  }

  ngAfterViewInit() {
    this.setupDraggable();
  }

  private setupDraggable() {
    const containerEl = document.getElementById('external-events')!;
    new Draggable(containerEl, {
      itemSelector: '.fc-event',
      eventData: (eventEl) => {
        const data = JSON.parse(eventEl.getAttribute('data-event')!);
        return {
          title: data.title,
          duration: '01:00',
          backgroundColor: data.color,
          borderColor: data.color,
          extendedProps: { ...data, isManual: false }
        };
      }
    });
  }

  private updateInventory(blockId: number) {
    const blockIndex = this.pendingBlocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const calendarApi = this.fullCalendar.getApi();
    const allEvents = calendarApi.getEvents();

    const assignedEvents = allEvents.filter(e => e.extendedProps['id'] === blockId);

    const totalMs = assignedEvents.reduce((acc, event) => {
      if (event.start && event.end) {
        return acc + (event.end.getTime() - event.start.getTime());
      }
      return acc;
    }, 0);

    const hours = totalMs / 3600000;

    this.pendingBlocks[blockIndex] = {
      ...this.pendingBlocks[blockIndex],
      assignedHours: parseFloat(hours.toFixed(2)),
      remainingHours: parseFloat(( this.pendingBlocks[blockIndex].totalHours - hours).toFixed(2))
    };

    this.pendingBlocks = [...this.pendingBlocks];
  }

  handleEventClick(info: any) {
    this.selectedEvent = info.event;
    const props = info.event.extendedProps;

    const isFormative = !!props.id && !props.isManual;

    if (isFormative) {
      this.tempSessionData = {
        title: info.event.title,
        description: props.description || ''
      };
      this.displayModal = true;
    } else {
      if (confirm(`¿Eliminar ${info.event.title}?`)) {
        this.deleteSelectedEvent();
      }
    }
  }

  private handleEventReceive(info: any) {
    const blockId = info.event.extendedProps.id;
    if (blockId) this.updateInventory(blockId);
  }

  private handleEventChange(info: any) {
    const blockId = info.event.extendedProps.id;
    if (blockId) this.updateInventory(blockId);
  }

  deleteSelectedEvent() {
    const blockId = this.selectedEvent.extendedProps.id;
    this.selectedEvent.remove();
    this.updateInventory(blockId);
    this.displayModal = false;
  }

  private getRandomColor(): string {
    const colors = [      '#be185d',
      '#4338ca',
      '#7c3aed',
      '#0369a1',
      '#0891b2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  addManualItem(type: string) {
    this.pendingBlocks.push({
      id: this.pendingBlocks.length + 1,
      type: type,
      title: type,
      description: '',
      color: this.getRandomColor(),
      totalHours: 1,
      assignedHours: 0,
      remainingHours: 1,
      isManual: true,
      isAssigned: false,
    })
  }

  saveSessionDetails() {
    this.selectedEvent.setProp('title', this.tempSessionData.title);
    this.selectedEvent.setExtendedProp('description', this.tempSessionData.description);

    this.displayModal = false;
    this.messageService.add({severity:'success', summary:'Actualizado', detail:'Sesión definida correctamente'});
  }

  saveEventWithTimeline() {

  }

  private resetToStartDate() {
    const calendarApi = this.fullCalendar.getApi();

    if (calendarApi && this.basicInfo?.startDate) {
      calendarApi.gotoDate(this.basicInfo.startDate);
    }
  }
}
