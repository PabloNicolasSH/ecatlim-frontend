import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserToLog} from './user-to-log.model';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
import {User} from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router)

  login(userToLog: UserToLog): Observable<any>{
    return this.http.post(`${environment.apiUrl}/auth/login`, userToLog).pipe(
      tap((res:any) => {
        localStorage.setItem('token', res.token);

        const name = res.profile?.name || 'Administrador';
        const surname = res.profile?.surname || 'Global';

        localStorage.setItem('me', JSON.stringify({
          name: name,
          surname: surname,
          email: res.email,
          role: res.role
        }));
      })
    )
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('me');
    this.router.navigateByUrl('/login');
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
