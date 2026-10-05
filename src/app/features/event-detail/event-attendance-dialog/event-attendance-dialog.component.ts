import {Component, computed, inject, input, model, output, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {DatePicker} from 'primeng/datepicker';
import {FloatLabel} from 'primeng/floatlabel';
import {MessageService} from 'primeng/api';
import {
  AttendanceType,
  EventDetail,
  EventDetailActivity,
  EventDetailParticipant
} from '../../../shared/models/event.model';
import {EventService} from '../../../shared/services/event.service';
import {ActivityService} from '../../../shared/services/activity.service';
import {LoggedUserDataService} from '../../../core/auth/logged-user-data-service';
import {Role} from '../../../shared/models/role.model';
import {notBlankValidator, MAX_TEXT} from '../../../shared/validation/validation-patterns';

export interface AttendanceChange {
  userId: number;
  lessonBlockId: number;
  attendance: AttendanceType | null;
}

interface TaskTarget {
  userId: number;
  lessonBlockId: number;
}

@Component({
  selector: 'app-event-attendance-dialog',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    Select,
    InputText,
    Textarea,
    DatePicker,
    FloatLabel
  ],
  templateUrl: './event-attendance-dialog.component.html'
})
export class EventAttendanceDialogComponent {

  private readonly eventService = inject(EventService);
  private readonly activityService = inject(ActivityService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly loggedUserDataService = inject(LoggedUserDataService);

  event = input.required<EventDetail>();
  visible = model<boolean>(false);

  attendanceChange = output<AttendanceChange>();
  activityCreated = output<EventDetailActivity>();

  saving = signal<string | null>(null);
  taskTarget = signal<TaskTarget | null>(null);
  creatingTask = signal<boolean>(false);

  readonly canCreateTasks = this.loggedUserDataService.hasAnyRole(
    Role.MANAGER_DIRECTOR, Role.MANAGEMENT, Role.EVENT_DIRECTOR, Role.TRAINER
  );

  readonly attendanceOptions: { label: string; value: AttendanceType | null }[] = [
    {label: 'Sin registrar', value: null},
    {label: 'Total', value: 'TOTAL'},
    {label: 'Parcial', value: 'PARTIAL'},
    {label: 'Tarea condicionada', value: 'CONDITIONED_TASK'}
  ];

  readonly taskTypes = [
    {label: 'Foro de Discusión', value: 'FORUM'},
    {label: 'Entrega de Archivos', value: 'FILE_UPLOAD'}
  ];

  taskForm = this.fb.group({
    title: ['', [Validators.required, notBlankValidator, Validators.minLength(5), Validators.maxLength(MAX_TEXT)]],
    description: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
    activityType: ['FILE_UPLOAD', Validators.required],
    dueDate: [null as Date | null, Validators.required],
    responsibleId: [null as number | null, Validators.required]
  });

  blocks = computed(() => {
    const event = this.event();
    const markable = new Set(event.markableLessonBlockIds);
    return event.lessonBlocks.flatMap(block => {
      const id = block.id;
      if (id === undefined || !markable.has(id)) return [];
      return [{
        id,
        code: block.code,
        name: block.name,
        participants: event.participants.filter(p => p.blocks.some(b => b.lessonBlockId === id))
      }];
    });
  });

  selectedBlockId = signal<number | null>(null);

  currentBlock = computed(() => {
    const blocks = this.blocks();
    return blocks.find(b => b.id === this.selectedBlockId()) ?? blocks[0] ?? null;
  });

  selectBlock(id: number): void {
    this.selectedBlockId.set(id);
    this.taskTarget.set(null);
  }

  trainers = computed(() => this.event().facilitators.map(t => ({
    id: t.id,
    fullName: [t.name, t.surname].filter(Boolean).join(' ') || t.email
  })));

  attendanceOf(person: EventDetailParticipant, lessonBlockId: number): AttendanceType | null {
    return person.blocks.find(b => b.lessonBlockId === lessonBlockId)?.attendance ?? null;
  }

  tasksOf(person: EventDetailParticipant, lessonBlockId: number): EventDetailActivity[] {
    return this.event().activities.filter(a => a.assignedUser?.id === person.userId && a.lessonBlockId === lessonBlockId);
  }

  fullName(person: EventDetailParticipant): string {
    return [person.surname, person.name].filter(Boolean).join(', ') || person.email;
  }

  summary(block: { participants: EventDetailParticipant[]; id: number }): string {
    const marked = block.participants.filter(p => this.attendanceOf(p, block.id) !== null).length;
    return `${marked}/${block.participants.length} registradas`;
  }

  isTaskOpen(person: EventDetailParticipant, lessonBlockId: number): boolean {
    const target = this.taskTarget();
    return target?.userId === person.userId && target.lessonBlockId === lessonBlockId;
  }

  setAttendance(person: EventDetailParticipant, lessonBlockId: number, attendance: AttendanceType | null): void {
    if (attendance === this.attendanceOf(person, lessonBlockId)) return;

    this.saving.set(`${person.userId}-${lessonBlockId}`);
    this.eventService.markAttendance(this.event().id, person.userId, lessonBlockId, attendance).subscribe({
      next: () => {
        this.saving.set(null);
        this.attendanceChange.emit({userId: person.userId, lessonBlockId, attendance});
        if (attendance === 'CONDITIONED_TASK' && this.canCreateTasks && this.tasksOf(person, lessonBlockId).length === 0) {
          this.openTaskForm(person, lessonBlockId);
        }
      },
      error: () => this.saving.set(null)
    });
  }

  openTaskForm(person: EventDetailParticipant, lessonBlockId: number): void {
    const event = this.event();
    const end = new Date(event.endDate);
    const dueDate = end.getTime() > Date.now() ? end : new Date(Date.now() + 24 * 60 * 60 * 1000);

    this.taskForm.reset({
      title: '',
      description: '',
      activityType: 'FILE_UPLOAD',
      dueDate,
      responsibleId: this.trainers().length === 1 ? this.trainers()[0].id : null
    });
    this.taskTarget.set({userId: person.userId, lessonBlockId});
  }

  cancelTask(): void {
    this.taskTarget.set(null);
  }

  createTask(): void {
    const target = this.taskTarget();
    if (!target) return;
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const value = this.taskForm.value;
    this.creatingTask.set(true);
    this.activityService.createActivity(this.event().id, {
      title: value.title,
      description: value.description,
      activityType: value.activityType,
      evaluationMethod: 'MANUAL',
      availableAt: new Date(),
      dueDate: value.dueDate,
      isOptional: false,
      lessonBlockId: target.lessonBlockId,
      responsibleId: value.responsibleId,
      assignedUserId: target.userId
    }).subscribe({
      next: (activity: EventDetailActivity) => {
        this.creatingTask.set(false);
        this.taskTarget.set(null);
        this.activityCreated.emit(activity);
        this.messageService.add({severity: 'success', summary: 'Tarea creada', detail: 'Solo la verá esta persona.'});
      },
      error: () => this.creatingTask.set(false)
    });
  }
}
