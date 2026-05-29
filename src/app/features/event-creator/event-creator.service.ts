import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EventCreatorService {

  toLocalISO(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
