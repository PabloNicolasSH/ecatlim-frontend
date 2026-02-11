import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserToLog} from './user-to-log.model';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
import {User} from '../../shared/models/user.model';
import {WebsocketService} from '../../shared/services/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly websocketService = inject(WebsocketService);
  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router)

  constructor() {
    if (this.isAuthenticated()){
      this.websocketService.initConnection(this.getToken()!);
    }
  }

  login(userToLog: UserToLog): Observable<any>{
    return this.http.post(`${environment.apiUrl}/auth/login`, userToLog).pipe(
      tap((res:any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('me', JSON.stringify({
          name: res.name,
          surname: res.surname,
          email: res.email,
          role: res.role,
          id: res.id
        }));
        this.websocketService.initConnection(res.token);
      })
    )
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('me');
    this.router.navigateByUrl('/login');
    this.websocketService.disconnect();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getProfile(): User {
    const profile = localStorage.getItem('me');
    return profile ? JSON.parse(profile) : null;
  }
}
