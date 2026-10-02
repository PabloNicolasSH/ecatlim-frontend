import {AfterViewInit, Component, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild} from '@angular/core';
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
import {Tooltip} from 'primeng/tooltip';
import {TimelineItem} from '../../../shared/models/timeline-item.model';
import {MultiSelect} from 'primeng/multiselect';
import {UserService} from '../../../shared/services/user.service';
import {Role} from '../../../shared/models/role.model';
import {User} from '../../../shared/models/user.model';
import {EventCreatorService} from '../event-creator.service';

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
  @Output() onSave = new EventEmitter<any[]>();
  @ViewChild('calendar') fullCalendar!: FullCalendarComponent;

  protected readonly messageService = inject(MessageService);
  protected readonly userService = inject(UserService);
  protected readonly eventCreatorService = inject(EventCreatorService);

  displayModal: boolean = false;
  selectedEvent: any = null;

  tempTimelineItem: TimelineItem = this.getEmptyTimelineItem();

  isDraggingOverInventory = false;

  trainers = signal<User[]>([]);

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    droppable: true,
    editable: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '24:00:00',
    allDaySlot: false,
    locale: 'es',
    defaultTimedEventDuration: '01:00',
    customButtons: {
      goToStart: {
        text: "Inicio del Evento",
        click: () => this.resetToStartDate()
      }
    },
    headerToolbar: { left: 'prev,next goToStart', center: 'title'},
    eventClick: (info) => {
      if (info.event.display === 'background'){return;}
      this.handleEventClick(info)
    },
    eventDragStart: (info) => {
      const trashEl = document.getElementById('inventory-footer');

      const onMouseMove = (e: MouseEvent) => {
        const isOver = this.isEventOverElement(e, trashEl);
        if (this.isDraggingOverInventory !== isOver) {
          this.isDraggingOverInventory = isOver;
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      (info.el as any)._onMouseMove = onMouseMove;
    },
    eventDragStop: (info) => {
      console.log("YA");
      const onMouseMove = (info.el as any)._onMouseMove;
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);

      const trashEl = document.getElementById('inventory-footer');
      const wasDroppedOver = this.isEventOverElement(info.jsEvent, trashEl);

      if (wasDroppedOver) {
        const blockId = info.event.extendedProps["id"];
        info.event.remove();

        if (blockId) {
          setTimeout(() => this.updateInventory(blockId), 0);
        }
      }
      this.isDraggingOverInventory = false;
    },
    eventReceive: (info) => this.handleEventReceive(info),
    eventResize: (info) => this.handleEventChange(info),
    eventDrop: (info) => this.handleEventChange(info),
  };

  ngOnInit() {
    this.pendingBlocks.forEach(b => {
      if (!b.color) b.color = this.getRandomColor();
    });

    this.addCalendarOptions();

    this.userService.getUsersByRole(Role.TRAINER)
      .subscribe({
          next: trainers => {this.trainers.set(trainers);}
      });
  }

  ngAfterViewInit() {
    this.setupDraggable();
  }

  addCalendarOptions() {
    if (this.basicInfo.startDate && this.basicInfo.endDate) {
      const startDate = new Date(this.basicInfo.startDate);
      const dayOfWeek = startDate.getDay();
      const endDate = new Date(this.basicInfo.endDate);

      this.calendarOptions = {
        ...this.calendarOptions,
        initialDate: startDate,
        firstDay: dayOfWeek,
        validRange: {
          start: this.basicInfo.startDate,
          end: this.basicInfo.endDate
        },
        eventConstraint: {
          start: this.basicInfo.startDate,
          end: this.basicInfo.endDate
        }
      }

      const backgroundEvents = this.generateBackgroundEvents(startDate, endDate);
      this.initialTimeline = this.adjustEventsToRange(this.initialTimeline, startDate, endDate);

      this.calendarOptions.eventSources = [
        {
          events: this.initialTimeline || [],
          id: 'timelineSource'
        },
        {
          events: backgroundEvents,
          display: 'background',
          backgroundColor: '#f0f0f0',
          id: 'backgroundSource'
        }
      ];
    }

    if (this.initialTimeline?.length > 0) {
      setTimeout(() => {
        const blockIds = [...new Set(this.initialTimeline
          .filter(e => e.extendedProps?.id)
          .map(e => e.extendedProps.id))];
        blockIds.forEach(id => this.updateInventory(id as number));
      }, 100);
    }
  }

  private generateBackgroundEvents(startDate: Date, endDate: Date): any[] {
    const startOfDayOne = new Date(startDate);
    startOfDayOne.setHours(0, 0, 0, 0);

    const endOfLastDay = new Date(endDate);
    endOfLastDay.setHours(23, 59, 59, 999);

    return [
      {
        start: startOfDayOne,
        end: startDate,
        allDay: false,
        display: 'background',
        backgroundColor: '#d1d1d1',
        borderColor: '#d1d1d1',
        editable: false,
        draggable: false,
        clickable: false,
        resizable: false,
        droppable: false
      },
      {
        start: endDate,
        end: endOfLastDay,
        allDay: false,
        display: 'background',
        backgroundColor: '#d1d1d1',
        borderColor: '#d1d1d1',
        editable: false,
        draggable: false,
        clickable: false,
        resizable: false,
        droppable: false
      }
    ];
  }

  private adjustEventsToRange(events: any[], rangeStart: Date, rangeEnd: Date): any[] {
    if (!events || events.length === 0) return [];

    return events.map(event => {
      if (event.display === 'background') return event;

      const eStart = new Date(event.start);
      const eEnd = new Date(event.end);
      const duration = eEnd.getTime() - eStart.getTime();

      let newStart = new Date(eStart);
      let newEnd = new Date(eEnd);

      if (eStart < rangeStart) {
        newStart = new Date(rangeStart);
        newEnd = new Date(newStart.getTime() + duration);
      }

      if (newEnd > rangeEnd) {
        newEnd = new Date(rangeEnd);
        newStart = new Date(newEnd.getTime() - duration);

        if (newStart < rangeStart) {
          newStart = new Date(rangeStart);
        }
      }

      return {
        ...event,
        start: newStart,
        end: newEnd
      };
    });
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
    let newTitle = this.tempTimelineItem.title;

    if (this.tempTimelineItem.itemType === 'FORMATIVE' && props.code) {
      if (!newTitle.startsWith(props.code)) {
        newTitle = `${props.code} ${newTitle}`;
      }
    }

    this.selectedEvent.setProp('title', newTitle);
    this.selectedEvent.setExtendedProp('description', this.tempTimelineItem.description);
    this.selectedEvent.setExtendedProp('itemType', this.tempTimelineItem.itemType);
    this.selectedEvent.setExtendedProp('educationSession', this.tempTimelineItem.educationSession);

    if (props.id) {
      this.updateInventory(props.id);
    }

    this.displayModal = false;
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
  }

  duplicateEvent() {
    const event = this.selectedEvent;
    const calendarApi = this.fullCalendar.getApi();

    const newStart = new Date(event.start);
    const newEnd = new Date(event.end);

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

    const timelineItems: TimelineItem[] = events
      .filter(e => e.display !== 'background' && e.extendedProps['id'])
      .map(e => (
        {
        title: e.title,
        description: e.extendedProps['description'],
        startTime: this.eventCreatorService.toLocalISO(e.start!) as any,
        endTime: this.eventCreatorService.toLocalISO(e.end!) as any,
        itemType: e.extendedProps['itemType'],
        educationSession: e.extendedProps['educationSession']
      }));

    this.onSave.emit(timelineItems);
  }

  goBack() {
    const calendarApi = this.fullCalendar.getApi();
    const currentEvents = calendarApi.getEvents()
      .filter(e => e.display !== 'background' && e.extendedProps['id'])
      .map(e => ({
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

  private isEventOverElement(jsEvent: MouseEvent, targetEl: HTMLElement | null) {
    if (!targetEl) return false;

    const rect = targetEl.getBoundingClientRect();
    return (
      jsEvent.clientX >= rect.left - 10 &&
      jsEvent.clientX <= rect.right + 10 &&
      jsEvent.clientY >= rect.top - 10 &&
      jsEvent.clientY <= rect.bottom + 10
    );
  }
}
