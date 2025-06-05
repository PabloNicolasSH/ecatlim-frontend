import { Component, Input } from '@angular/core';
import {DecimalPipe, NgClass} from '@angular/common';

@Component({
  selector: 'app-hours-metre',
  standalone: true,
  templateUrl: './hours-metre.component.html',
  imports: [
    DecimalPipe,
    NgClass
  ],
  styleUrl: './hours-metre.component.scss'
})
export class HoursMetreComponent {
  @Input() show: Array<'online' | 'contact' | 'practices'> = ['online', 'contact', 'practices'];
  @Input() hours!: { online: number; contact: number; practical: number };
  @Input() maxLimits!: { online: number; contact: number; practices: number };

  get metresToShow() {
    const mapping = {
      online: {
        label: 'Online',
        value: this.hours.online,
        max: this.maxLimits.online,
        icon: 'pi pi-globe',
        color: this.hours.online > this.maxLimits.online ? '#E53935' : '#42A5F5'
      },
      contact: {
        label: 'Presenciales',
        value: this.hours.contact,
        max: this.maxLimits.contact,
        icon: 'pi pi-users',
        color: this.hours.contact > this.maxLimits.contact ? '#E53935' : '#66BB6A'
      },
      practices: {
        label: 'Prácticas',
        value: this.hours.practical,
        max: this.maxLimits.practices,
        icon: 'pi pi-cog',
        color: this.hours.practical > this.maxLimits.practices ? '#E53935' : '#FFA726'
      }
    };

    return this.show.map(key => {
      const exceeded = mapping[key].value > mapping[key].max;
      return {
        label: mapping[key].label,
        value: mapping[key].value,
        max: mapping[key].max,
        icon: mapping[key].icon,
        color: mapping[key].color,
        exceeded
      }
    });
  }
}
