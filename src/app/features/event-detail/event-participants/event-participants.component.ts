import {Component, input, output, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Tooltip} from 'primeng/tooltip';
import {Button} from 'primeng/button';
import {AttendanceType, EventDetailParticipant} from '../../../shared/models/event.model';
import {UserAvatarComponent} from '../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-event-participants',
  imports: [
    NgClass,
    TableModule,
    Tooltip,
    Button,
    UserAvatarComponent
  ],
  templateUrl: './event-participants.component.html',
  styleUrl: './event-participants.component.scss'
})
export class EventParticipantsComponent {

  readonly pageSize = 5;

  participants = input.required<EventDetailParticipant[]>();
  started = input<boolean>(false);
  canTakeAttendance = input<boolean>(false);

  takeAttendance = output<void>();

  showFullData = signal<boolean>(true);

  readonly paymentStyles = {
    PAID: {label: 'Pagado', classes: 'bg-emerald-100 text-emerald-800'},
    PENDING: {label: 'Pendiente', classes: 'bg-amber-100 text-amber-800'},
    REFUNDED: {label: 'Devuelto', classes: 'bg-stone-200 text-stone-700'}
  };

  readonly attendanceStyles: Record<AttendanceType, { label: string; classes: string }> = {
    TOTAL: {label: 'Total', classes: 'bg-emerald-100 text-emerald-800'},
    PARTIAL: {label: 'Parcial', classes: 'bg-amber-100 text-amber-800'},
    CONDITIONED_TASK: {label: 'Tarea condicionada', classes: 'bg-sky-100 text-sky-800'}
  };

  attendanceStyle(attendance: AttendanceType) {
    return this.attendanceStyles[attendance];
  }

  paymentStyle(status: string) {
    return this.paymentStyles[status as keyof typeof this.paymentStyles] ?? this.paymentStyles.PENDING;
  }

  fullName(person: EventDetailParticipant): string {
    return [person.name, person.surname].filter(Boolean).join(' ') || person.email;
  }

  initials(person: EventDetailParticipant): string {
    return this.fullName(person).charAt(0).toUpperCase();
  }
}
