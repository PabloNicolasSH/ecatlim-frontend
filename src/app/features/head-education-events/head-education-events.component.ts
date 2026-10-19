import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DatePipe, NgTemplateOutlet} from '@angular/common';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';
import {HeadEducationService} from '../../shared/services/head-education.service';
import {HeadEducationEvent, HeadEducationEventAttendee} from '../../shared/models/head-education.model';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-head-education-events',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    Button,
    Tooltip,
    UserAvatarComponent
  ],
  templateUrl: './head-education-events.component.html'
})
export class HeadEducationEventsComponent implements OnInit {

  private readonly headEducationService = inject(HeadEducationService);

  events = signal<HeadEducationEvent[]>([]);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);

  private readonly now = Date.now();

  activeTab = signal<'upcoming' | 'past'>('upcoming');
  visibleEvents = computed(() => this.activeTab() === 'upcoming' ? this.upcomingEvents() : this.pastEvents());

  upcomingEvents = computed(() => this.events()
    .filter(event => new Date(event.endDate).getTime() >= this.now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));

  pastEvents = computed(() => this.events()
    .filter(event => new Date(event.endDate).getTime() < this.now)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.failed.set(false);
    this.headEducationService.getEvents().subscribe({
      next: events => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  isUpcoming(event: HeadEducationEvent): boolean {
    return new Date(event.endDate).getTime() >= this.now;
  }

  fullName(attendee: HeadEducationEventAttendee): string {
    return [attendee.surname, attendee.name].filter(Boolean).join(', ') || attendee.email;
  }

  initials(attendee: HeadEducationEventAttendee): string {
    return (attendee.name ?? attendee.email).charAt(0).toUpperCase();
  }
}
