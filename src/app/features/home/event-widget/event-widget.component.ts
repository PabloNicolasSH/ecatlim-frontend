import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {EventService} from '../../../shared/services/event.service';
import {DatePipe} from '@angular/common';
import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-event-widget',
  imports: [
    DatePipe,
    Button,
    Tag,
    RouterLink
  ],
  templateUrl: './event-widget.component.html',
  styleUrl: './event-widget.component.scss'
})
export class EventWidgetComponent implements OnInit, OnDestroy{

  private readonly eventService = inject(EventService);

  private allEvents = toSignal(this.eventService.getEventsForHome(), { initialValue: [] });
  public nextEvent = computed(() => this.allEvents()[0]);
  public upcomingEvents = computed(() => this.allEvents().slice(1));

  public currentTime = signal(new Date().getTime());
  private timerId?: any;

  public timeLeft = computed(() => {
    const event = this.nextEvent();
    if (!event) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const eventTime = new Date(event.startDate).getTime();
    const diff = eventTime - this.currentTime();

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  });

  public formattedTime = computed(() => {
    const time = this.timeLeft();

    const format = (num: number) => String(num).padStart(2, '0');

    return {
      days: format(time.days),
      hours: format(time.hours),
      minutes: format(time.minutes),
      seconds: format(time.seconds)
    };
  });

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.currentTime.set(new Date().getTime());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  getColor(educationStageCode: string | undefined) {
    switch (educationStageCode) {
      case 'AS': return 'var(--color-blue-500)';
      case 'ES': return 'var(--color-purple-600)';
      case 'CS': return 'var(--color-ecatlim)';
      default: return 'var(--color-green-600)';
    }
  }
}
