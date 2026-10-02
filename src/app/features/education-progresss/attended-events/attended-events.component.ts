import {Component, computed, inject, input, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {catchError, of, switchMap} from 'rxjs';
import {Dialog} from 'primeng/dialog';
import {Timeline} from 'primeng/timeline';
import {Tag} from 'primeng/tag';
import {Tooltip} from 'primeng/tooltip';
import {EnrollmentService} from '../../../shared/services/enrollment.service';
import {AttendedEvent} from '../../../shared/models/event.model';

@Component({
  selector: 'app-attended-events',
  imports: [
    DatePipe,
    Dialog,
    Timeline,
    Tag,
    Tooltip
  ],
  templateUrl: './attended-events.component.html',
  styleUrl: './attended-events.component.scss'
})
export class AttendedEventsComponent {

  private static readonly PREVIEW_SIZE = 3;

  protected readonly enrollmentService = inject(EnrollmentService);

  stageId = input<number | null>(null);

  historyVisible = signal<boolean>(false);

  events = toSignal(
    toObservable(this.stageId).pipe(
      switchMap(id => id == null
        ? of([] as AttendedEvent[])
        : this.enrollmentService.getAttendedEvents(id).pipe(catchError(() => of([] as AttendedEvent[])))
      )
    ),
    {initialValue: [] as AttendedEvent[]}
  );

  previewEvents = computed(() => this.events().slice(0, AttendedEventsComponent.PREVIEW_SIZE));

  isMultiDay(event: AttendedEvent): boolean {
    return new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString();
  }
}
