import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Notification, NotificationPreferences} from '../models/notification.model';
import {WebsocketService} from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly http = inject(HttpClient);
  private readonly websocketService = inject(WebsocketService);

  private readonly apiUrl = `${environment.apiUrl}/notification`;
  private subscriptions: Subscription[] = [];

  readonly notifications = signal<Notification[]>([]);
  readonly pendingCount = signal(0);

  init() {
    if (this.subscriptions.length > 0) {
      return;
    }
    this.subscriptions = [
      this.websocketService.getNewNotifications().subscribe(notification => {
        this.notifications.update(list => [notification, ...list.filter(n => n.id !== notification.id)]);
        this.refreshPendingCount();
      }),
      this.websocketService.getUpdatedNotifications().subscribe(updated => {
        this.notifications.update(list => list.map(n => n.id === updated.id ? updated : n));
        this.refreshPendingCount();
      })
    ];
    this.load();
  }

  reset() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    this.notifications.set([]);
    this.pendingCount.set(0);
  }

  load() {
    this.http.get<Notification[]>(this.apiUrl).subscribe(list => this.notifications.set(list));
    this.refreshPendingCount();
  }

  markAsRead(notification: Notification) {
    if (notification.read) {
      return;
    }
    this.http.post<void>(`${this.apiUrl}/${notification.id}/read`, null).subscribe(() => {
      this.notifications.update(list => list.map(n => n.id === notification.id
        ? {...n, read: true, pending: n.requiresAction ? n.pending : false}
        : n));
      this.refreshPendingCount();
    });
  }

  markAllAsRead() {
    this.http.post<void>(`${this.apiUrl}/read-all`, null).subscribe(() => {
      this.notifications.update(list => list.map(n => ({
        ...n,
        read: true,
        pending: n.requiresAction ? n.pending : false
      })));
      this.refreshPendingCount();
    });
  }

  getPreferences() {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/preferences`);
  }

  setEmailReminders(emailReminders: boolean) {
    return this.http.put<NotificationPreferences>(`${this.apiUrl}/preferences`, {emailReminders});
  }

  private refreshPendingCount() {
    this.http.get<{ count: number }>(`${this.apiUrl}/pending-count`)
      .subscribe(res => this.pendingCount.set(res.count));
  }
}
