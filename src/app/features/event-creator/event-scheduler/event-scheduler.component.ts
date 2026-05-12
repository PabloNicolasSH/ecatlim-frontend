import { AfterViewInit, Component, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { DatePipe, JsonPipe } from '@angular/common';
import { ProgressBar } from 'primeng/progressbar';
import { Button } from 'primeng/button';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { HoursPipe } from '../../../shared/pipes/hours.pipe';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import { EventService } from '../../../shared/services/event.service';
import {TimelineItem} from '../../../shared/models/timeline-item.model';
import {MultiSelect} from 'primeng/multiselect';

@Component({
  selector: 'app-event-scheduler',
  standalone: true,
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
    FormsModule,
    Tooltip,
    MultiSelect
  ],
  templateUrl: './event-scheduler.component.html',
  styleUrl: './event-scheduler.component.scss'
})
export class EventSchedulerComponent implements OnInit, AfterViewInit {
  @Input() basicInfo: any;
  @Input() pendingBlocks: any[] = [];
  @Input() initialTimeline!: any[];
  @Output() onBack = new EventEmitter<any[]>();
  @ViewChild('calendar') fullCalendar!: FullCalendarComponent;

  protected readonly messageService = inject(MessageService);
  protected readonly eventService = inject(EventService);

  displayModal: boolean = false;
  selectedEvent: any = null;

  tempTimelineItem: TimelineItem = this.getEmptyTimelineItem();

  trainers: any[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    droppable: true,
    editable: true,
    slotMinTime: '07:00:00',
    slotMaxTime: '24:00:00',
    allDaySlot: false,
    locale: 'es',
    firstDay: 1,
    buttonText: { day: "Vista por día", week: "Vista por semana" },
    customButtons: {
      goToStart: {
        text: "Inicio del Evento",
        click: () => this.resetToStartDate()
      }
    },
    headerToolbar: { left: 'prev,next goToStart', center: 'title', right: 'timeGridDay,timeGridWeek' },
    eventClick: (info) => this.handleEventClick(info),
    eventReceive: (info) => this.handleEventReceive(info),
    eventResize: (info) => this.handleEventChange(info),
    eventDrop: (info) => this.handleEventChange(info),
  };

  ngOnInit() {
    this.pendingBlocks.forEach(b => {
      if (!b.color) b.color = this.getRandomColor();
    });

    this.addCalendarOptions();
  }

  ngAfterViewInit() {
    this.setupDraggable();
  }

  addCalendarOptions() {
    if (this.basicInfo.startDate && this.basicInfo.endDate) {
      this.calendarOptions = {
        ...this.calendarOptions,
        initialDate: this.basicInfo.startDate,
        validRange: {
          start: this.basicInfo.startDate,
          end: this.basicInfo.endDate
        },
        eventConstraint: {
          start: this.basicInfo.startDate,
          end: this.basicInfo.endDate
        }
      }
    }

    if (this.initialTimeline && this.initialTimeline.length > 0) {
      this.calendarOptions.events = this.initialTimeline;
      setTimeout(() => {
        const blockIds = [...new Set(this.initialTimeline
          .filter(e => e.extendedProps?.id)
          .map(e => e.extendedProps.id))];
        blockIds.forEach(id => this.updateInventory(id as number));
      }, 100);
    }
  }

  private getEmptyTimelineItem(): TimelineItem {
    return {
      title: '',
      description: '',
      startTime: new Date(),
      endTime: new Date(),
      itemType: 'LOGISTIC'
    };
  }

  private setupDraggable() {
    const containerEl = document.getElementById('external-events')!;
    new Draggable(containerEl, {
      itemSelector: '.fc-event',
      eventData: (eventEl) => {
        const data = JSON.parse(eventEl.getAttribute('data-event')!);
        const displayTitle = data.itemType == 'LOGISTIC' ? data.title : `${data.code || ''} ${data.title}`;
        return {
          title: displayTitle,
          duration: '01:00',
          backgroundColor: data.color,
          borderColor: data.color,
          constraint: {
            start: this.basicInfo.startDate,
            end: this.basicInfo.endDate
          },
          extendedProps: {
            ...data,
            itemType: data.itemType == 'LOGISTIC' ? data.itemType : 'FORMATIVE'
          }
        };
      }
    });
  }

  handleEventClick(info: any) {
    this.selectedEvent = info.event;
    const props = info.event.extendedProps;

    this.tempTimelineItem = {
      title: info.event.title,
      description: props.description || '',
      startTime: info.event.start!,
      endTime: info.event.end!,
      itemType: props.itemType || (props.isManual ? props.type : 'FORMATIVE'),
      educationSession: {
        lessonBlockId: props.id,
        trainerIds: props.educationSession?.trainerIds || []
      }
    };

    if (this.tempTimelineItem.itemType === 'FORMATIVE' && props.code) {
      const code = props.code;
      if (this.tempTimelineItem.title.startsWith(code)) {
        this.tempTimelineItem.title = this.tempTimelineItem.title.replace(code, '').trim();
      }
    }

    this.displayModal = true;
  }

  saveSessionDetails() {
    const props = this.selectedEvent.extendedProps;
    let finalTitle = this.tempTimelineItem.title;

    if (this.tempTimelineItem.itemType === 'FORMATIVE' && props.code) {
      if (!finalTitle.startsWith(props.code)) {
        finalTitle = `${props.code} ${finalTitle}`;
      }
    }

    this.selectedEvent.setProp('title', finalTitle);
    this.selectedEvent.setExtendedProps({
      ...props,
      description: this.tempTimelineItem.description,
      itemType: this.tempTimelineItem.itemType,
      educationSession: this.tempTimelineItem.educationSession
    });

    this.displayModal = false;
    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ítem de cronograma guardado' });
  }

  private updateInventory(blockId: number) {
    const blockIndex = this.pendingBlocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const block = this.pendingBlocks[blockIndex];
    const calendarApi = this.fullCalendar.getApi();
    const assignedEvents = calendarApi.getEvents().filter(e => e.extendedProps['id'] === blockId);

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
      remainingHours: block.isManual ? 0 : parseFloat((block.totalHours - hours).toFixed(2))
    };

    this.pendingBlocks = [...this.pendingBlocks];
  }

  replicateEventAcrossDays() {
    const event = this.selectedEvent;
    const calendarApi = this.fullCalendar.getApi();
    const eventEnd = new Date(this.basicInfo.endDate);

    let currentDay = new Date(event.start);
    currentDay.setDate(currentDay.getDate() + 1);

    while (currentDay <= eventEnd) {
      const newStart = new Date(currentDay);
      newStart.setHours(event.start.getHours(), event.start.getMinutes());
      const newEnd = new Date(currentDay);
      newEnd.setHours(event.end.getHours(), event.end.getMinutes());

      calendarApi.addEvent({
        title: event.title,
        start: newStart,
        end: newEnd,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        extendedProps: { ...event.extendedProps }
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }

    this.displayModal = false;
    this.messageService.add({ severity: 'info', summary: 'Copiado', detail: 'Evento replicado' });
  }

  duplicateEvent() {
    const event = this.selectedEvent;
    const calendarApi = this.fullCalendar.getApi();

    const newStart = new Date(event.start);
    newStart.setMinutes(newStart.getMinutes() + 30);
    const newEnd = new Date(event.end);
    newEnd.setMinutes(newEnd.getMinutes() + 30);

    calendarApi.addEvent({
      title: event.title,
      start: newStart,
      end: newEnd,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      extendedProps: { ...event.extendedProps }
    });

    if (event.extendedProps['id'] && !event.extendedProps['isManual']) {
      this.updateInventory(event.extendedProps['id']);
    }

    this.displayModal = false;
    this.messageService.add({ severity: 'success', summary: 'Duplicado', detail: 'Copia creada' });
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
    if (blockId) this.updateInventory(blockId);
    this.displayModal = false;
  }

  saveEventWithTimeline() {
    const calendarApi = this.fullCalendar.getApi();
    const events = calendarApi.getEvents();

    const timelineItems: TimelineItem[] = events.map(e => ({
      title: e.title,
      description: e.extendedProps['description'],
      startTime: e.start!,
      endTime: e.end!,
      itemType: e.extendedProps['itemType'],
      educationSession: e.extendedProps['educationSession']
    }));

    const eventDto = {
      ...this.basicInfo,
      directorId: this.basicInfo.selectedDirector?.id,
      lessonBlockIds: this.basicInfo.selectedBlocks.map((b: any) => b.id),
      timelineItems: timelineItems
    };

    this.eventService.saveEvent(eventDto).subscribe({
      next: () => this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evento y cronograma guardados' }),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' })
    });
  }

  goBack() {
    const calendarApi = this.fullCalendar.getApi();
    const currentEvents = calendarApi.getEvents().map(e => ({
      title: e.title,
      start: e.start,
      end: e.end,
      backgroundColor: e.backgroundColor,
      borderColor: e.borderColor,
      extendedProps: e.extendedProps
    }));
    this.onBack.emit(currentEvents);
  }

  private resetToStartDate() {
    const calendarApi = this.fullCalendar.getApi();
    if (calendarApi && this.basicInfo?.startDate) {
      calendarApi.gotoDate(this.basicInfo.startDate);
    }
  }

  private getRandomColor(): string {
    const colors = ['#be185d', '#4338ca', '#7f59bc', '#0369a1', '#0891b2'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
