import {inject, Injectable} from '@angular/core';
import {Role} from '../../shared/models/role.model';
import {User} from '../../shared/models/user.model';
import {HttpClient} from '@angular/common/http';
import {SafeUrl} from '@angular/platform-browser';
import {BehaviorSubject, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggedUserDataService {
  protected readonly http = inject(HttpClient);

  private objectUrl: string | null = null;
  private readonly avatarSource = new BehaviorSubject<SafeUrl | null>(null);
  public avatarUrl$: Observable<SafeUrl | null> = this.avatarSource.asObservable();

  setUserData(user: User): void {
    localStorage.setItem('me', JSON.stringify(user));
    this.loadAvatar();
  }

  getLoggedUserData(): User {
    const loggedUserData = localStorage.getItem('me');
    return loggedUserData ? JSON.parse(loggedUserData) : null;
  }

  hasAnyRole(...roles: Role[]): boolean {
    const user = this.getLoggedUserData();
    if (!user) {
      return false;
    }
    return user.roles.some(role => roles.includes(role));
  }

  public loadAvatar(): void {
    const avatarUrl = this.getLoggedUserData()?.profile?.avatarUrl;
    if (!avatarUrl) {
      this.avatarSource.next(null);
      return;
    }

    const thumbnailUrl = `${environment.apiUrl}${avatarUrl.replace('/files/', '/files/thumbnail/')}`;

    this.http.get(thumbnailUrl, {responseType: 'blob'}).subscribe({
      next: (blob: Blob) => {
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
        }

        this.objectUrl = URL.createObjectURL(blob);
        this.avatarSource.next(this.objectUrl);
      },
      error: (err) => {
        console.error('Error al descargar el avatar en el servicio:', err);
        this.avatarSource.next(null);
      }
    });
  }

  public getLatestAvatar(): SafeUrl | null {
    return this.avatarSource.getValue();
  }

  public clearAvatar(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.avatarSource.next(null);
  }
}
