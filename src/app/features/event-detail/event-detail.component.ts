import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {CurrencyPipe, DatePipe, NgClass} from '@angular/common';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';
import {EventService} from '../../shared/services/event.service';
import {
  EventDetail,
  EventDetailActivity,
  EventDetailParticipant,
  EventDetailTimelineEntry
} from '../../shared/models/event.model';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';
import {EventParticipantsComponent} from './event-participants/event-participants.component';

interface TimelineDay {
  date: string;
  entries: EventDetailTimelineEntry[];
}

@Component({
  selector: 'app-event-detail',
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    NgClass,
    Button,
    Tooltip,
    UserAvatarComponent,
    EventParticipantsComponent
  ],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss'
})
export class EventDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);

  event = signal<EventDetail | null>(null);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);

  readonly statusStyles = {
    PUBLISHED: {label: 'Publicado', classes: 'bg-emerald-100 text-emerald-800'},
    PENDING: {label: 'Pendiente', classes: 'bg-amber-100 text-amber-800'},
    DRAFT: {label: 'Borrador', classes: 'bg-stone-200 text-stone-700'}
  };

  readonly notificationLabels: Record<string, string> = {
    INTERESTED_USERS: 'Personas interesadas',
    AVAILABLE_USERS: 'Personas con disponibilidad',
    HEAD_OF_EDUCATION: 'Coordinación de formación'
  };

  readonly activityTypes: Record<string, { label: string; icon: string }> = {
    FORUM: {label: 'Foro', icon: 'pi-comments'},
    GLOSSARY: {label: 'Glosario', icon: 'pi-book'},
    SURVEY: {label: 'Encuesta', icon: 'pi-list-check'},
    FILE_UPLOAD: {label: 'Entrega de archivo', icon: 'pi-upload'}
  };

  isPast = computed(() => {
    const event = this.event();
    return !!event && new Date(event.endDate).getTime() < Date.now();
  });

  isMultiDay = computed(() => {
    const event = this.event();
    return !!event && new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString();
  });

  inscriptionOpen = computed(() => {
    const config = this.event()?.config;
    if (!config) return false;
    const now = Date.now();
    return new Date(config.dateOpenInscription).getTime() <= now && now <= new Date(config.dateCloseInscription).getTime();
  });

  totalHours = computed(() => {
    const event = this.event();
    return (event?.theoreticalHours ?? 0) + (event?.practicalHours ?? 0) + (event?.onlineHours ?? 0);
  });

  paidCount = computed(() => this.countByPayment('PAID'));
  pendingCount = computed(() => this.countByPayment('PENDING'));

  attendedCount = computed(() =>
    (this.event()?.participants ?? []).filter(p => p.blocks.length > 0 && p.blocks.every(b => b.attended)).length
  );

  quorumPercent = computed(() => {
    const event = this.event();
    const min = event?.config?.minParticipants ?? 0;
    if (!event || min <= 0) return 0;
    return Math.min(100, Math.round(event.participants.length / min * 100));
  });

  timelineDays = computed<TimelineDay[]>(() => {
    const days = new Map<string, EventDetailTimelineEntry[]>();
    [...(this.event()?.timeline ?? [])]
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .forEach(entry => {
        const key = new Date(entry.startTime).toDateString();
        days.set(key, [...(days.get(key) ?? []), entry]);
      });
    return [...days.entries()].map(([, entries]) => ({date: entries[0].startTime, entries}));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.eventService.getEventDetail(id).subscribe({
      next: event => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  fullName(person: { name?: string; surname?: string; email: string }): string {
    return [person.name, person.surname].filter(Boolean).join(' ') || person.email;
  }

  initials(person: { name?: string; surname?: string; email: string }): string {
    return this.fullName(person).charAt(0).toUpperCase();
  }

  activityType(activity: EventDetailActivity) {
    return this.activityTypes[activity.activityType] ?? {label: activity.activityType, icon: 'pi-file'};
  }

  /** "Previa" if the activity closes before or during the event, "Post" if it closes after it ends. */
  phase(activity: EventDetailActivity): "PREVIA" | "POST" {
    const eventEnd = new Date(this.event()!.endDate).getTime();
    return new Date(activity.dueDate).getTime() <= eventEnd ? "PREVIA" : "POST";
  }

  private countByPayment(status: EventDetailParticipant['paymentStatus']): number {
    return (this.event()?.participants ?? []).filter(p => p.paymentStatus === status).length;
  }
}
