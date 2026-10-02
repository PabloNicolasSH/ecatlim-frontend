import {Component, input, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Tooltip} from 'primeng/tooltip';
import {EventDetailParticipant} from '../../../shared/models/event.model';
import {UserAvatarComponent} from '../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-event-participants',
  imports: [
    NgClass,
    TableModule,
    Tooltip,
    UserAvatarComponent
  ],
  templateUrl: './event-participants.component.html',
  styleUrl: './event-participants.component.scss'
})
export class EventParticipantsComponent {

  readonly pageSize = 5;

  participants = input.required<EventDetailParticipant[]>();
  isPast = input<boolean>(false);

  showFullData = signal<boolean>(true);

  readonly paymentStyles = {
    PAID: {label: 'Pagado', classes: 'bg-emerald-100 text-emerald-800'},
    PENDING: {label: 'Pendiente', classes: 'bg-amber-100 text-amber-800'},
    REFUNDED: {label: 'Devuelto', classes: 'bg-stone-200 text-stone-700'}
  };

  paymentStyle(status: string) {
    return this.paymentStyles[status as keyof typeof this.paymentStyles] ?? this.paymentStyles.PENDING;
  }

  fullName(person: EventDetailParticipant): string {
    return [person.name, person.surname].filter(Boolean).join(' ') || person.email;
  }

  initials(person: EventDetailParticipant): string {
    return this.fullName(person).charAt(0).toUpperCase();
  }

  attendedAll(participant: EventDetailParticipant): boolean {
    return participant.blocks.length > 0 && participant.blocks.every(b => b.attended);
  }
}
