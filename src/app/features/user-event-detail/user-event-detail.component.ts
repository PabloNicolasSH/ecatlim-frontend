import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {DatePipe, NgClass} from '@angular/common';
import {forkJoin} from 'rxjs';
import {Button} from 'primeng/button';
import {Popover} from 'primeng/popover';
import {Tooltip} from 'primeng/tooltip';
import {MessageService} from 'primeng/api';
import {EventService} from '../../shared/services/event.service';
import {EnrollmentService} from '../../shared/services/enrollment.service';
import {ActivityService} from '../../shared/services/activity.service';
import {EventDetailActivity, UserEventCalendar} from '../../shared/models/event.model';
import {LessonBlockCalendarSummary} from '../../shared/models/lesson-block.model';
import {LoggedUserDataService} from '../../core/auth/logged-user-data-service';
import {Role} from '../../shared/models/role.model';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-user-event-detail',
  imports: [
    RouterLink,
    DatePipe,
    NgClass,
    Button,
    Popover,
    Tooltip,
    UserAvatarComponent
  ],
  templateUrl: './user-event-detail.component.html',
  styleUrl: './user-event-detail.component.scss'
})
export class UserEventDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly activityService = inject(ActivityService);
  private readonly messageService = inject(MessageService);
  private readonly loggedUserDataService = inject(LoggedUserDataService);

  private eventId = 0;

  event = signal<UserEventCalendar | null>(null);
  activities = signal<EventDetailActivity[]>([]);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  saving = signal<boolean>(false);

  selectedBlockIds = signal<number[]>([]);

  readonly isStudent = this.loggedUserDataService.hasAnyRole(Role.STUDENT);

  orderedBlocks = computed<LessonBlockCalendarSummary[]>(() =>
    [...(this.event()?.lessonBlocks ?? [])].sort((a, b) => a.code.localeCompare(b.code))
  );

  enrolledBlocks = computed(() => {
    const codes = this.event()?.enrolledBlockCodes ?? [];
    return this.orderedBlocks().filter(block => codes.includes(block.code));
  });

  enrolledCount = computed(() => this.enrolledBlocks().length);
  totalBlocks = computed(() => this.orderedBlocks().length);
  fullyEnrolled = computed(() => this.totalBlocks() > 0 && this.enrolledCount() === this.totalBlocks());
  progressPercent = computed(() => this.totalBlocks() === 0 ? 0 : Math.round(this.enrolledCount() / this.totalBlocks() * 100));

  isMultiDay = computed(() => {
    const event = this.event();
    return !!event && new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString();
  });

  isPast = computed(() => {
    const event = this.event();
    return !!event && new Date(event.endDate).getTime() < Date.now();
  });

  pendingActivities = computed(() =>
    this.activities().filter(a => a.progressStatus !== 'COMPLETED' && new Date(a.dueDate).getTime() >= Date.now()).length
  );

  totalHours = computed(() => this.orderedBlocks().reduce((sum, block) => sum + (block.hours ?? 0), 0));

  canEnroll = computed(() => {
    const event = this.event();
    return !!event && !!event.canParticipate && !event.isEventClosed && !this.isPast() && !this.fullyEnrolled();
  });

  canUnenroll = computed(() => {
    const event = this.event();
    return !!event && !!event.isCurrentUserAttending && !event.isEventClosed && !this.isPast();
  });

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private load() {
    forkJoin({
      events: this.eventService.getUserEventsForCalendar(),
      activities: this.activityService.getActivitiesByEvent(this.eventId)
    }).subscribe({
      next: ({events, activities}) => {
        this.applyEvents(events);
        this.activities.set(activities as EventDetailActivity[]);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  private applyEvents(events: UserEventCalendar[]) {
    const found = events.find(e => Number(e.id) === this.eventId) ?? null;
    this.event.set(found);
    this.failed.set(found === null);
  }

  phase(activity: EventDetailActivity): 'PREVIA' | 'POST' {
    const eventEnd = new Date(this.event()!.endDate).getTime();
    return new Date(activity.dueDate).getTime() <= eventEnd ? 'PREVIA' : 'POST';
  }

  isBlockEnrolled(block: LessonBlockCalendarSummary): boolean {
    return (this.event()?.enrolledBlockCodes ?? []).includes(block.code);
  }

  fullName(person: { name?: string; surname?: string; email: string }): string {
    return [person.name, person.surname].filter(Boolean).join(' ') || person.email;
  }

  toggleBlockSelection(blockId: number, checked: boolean) {
    this.selectedBlockIds.update(ids => checked ? [...ids, blockId] : ids.filter(id => id !== blockId));
  }

  registerToBlocks(blockIds: number[]) {
    if (blockIds.length === 0) return;
    this.saving.set(true);
    this.enrollmentService.enrollInEvent(this.eventId, blockIds).subscribe({
      next: () => this.afterChange('¡Inscripción procesada con éxito!', 'Acuérdate de revisar los detalles en tu calendario.'),
      error: () => this.onError('Error al inscribirse')
    });
  }

  unregisterFromBlocks(blockIds: number[]) {
    if (blockIds.length === 0) return;
    this.saving.set(true);
    this.enrollmentService.unenrollInEvent(this.eventId, blockIds).subscribe({
      next: () => this.afterChange('Te has desinscrito correctamente'),
      error: () => this.onError('Error al desinscribirse')
    });
  }

  registerToAll() {
    const pending = this.orderedBlocks().filter(b => !this.isBlockEnrolled(b)).map(b => b.id!);
    this.registerToBlocks(pending);
  }

  unregisterFromAll() {
    this.unregisterFromBlocks(this.enrolledBlocks().map(b => b.id!));
  }

  private afterChange(summary: string, detail?: string) {
    this.messageService.add({severity: 'success', summary, detail});
    this.selectedBlockIds.set([]);
    this.eventService.getUserEventsForCalendar().subscribe({
      next: events => {
        this.applyEvents(events);
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  private onError(summary: string) {
    this.saving.set(false);
    this.messageService.add({severity: 'error', summary, detail: 'No se pudo completar la acción.'});
  }
}
