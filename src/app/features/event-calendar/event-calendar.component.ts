import { Component } from '@angular/core';
import {CalendarOptions} from '@fullcalendar/core';
import {FullCalendarModule} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';

@Component({
  selector: 'app-event-calendar',
  imports: [
    FullCalendarModule
  ],
  templateUrl: './event-calendar.component.html',
  styleUrl: './event-calendar.component.scss'
})
export class EventCalendarComponent {

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    customButtons:{
      seeAllEventsButton: {
        text: 'Ver todos los eventos',
        click: () => this.seeAllEvents()
      }
    },
    headerToolbar: {
      left: 'title',
      right: 'prev,next today seeAllEventsButton'
    },
    buttonText: {
      today: 'Hoy',
      seeAllEventsButton: 'Ver'
    },
    events: [],
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    locale: 'es',
    height: 'auto',
  };

  private seeAllEvents() {
    console.log("Ver todos los eventos");
  }
}
