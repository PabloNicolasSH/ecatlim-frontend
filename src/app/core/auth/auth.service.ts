import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
import {AuthLoginResponse, UserToLog} from './auth-models';
import {LoggedUserDataService} from './logged-user-data-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router);
  protected readonly loggedUserDataService = inject(LoggedUserDataService);

  login(userToLog: UserToLog): Observable<any> {
    return this.http.post<AuthLoginResponse>(`${environment.apiUrl}/auth/login`, userToLog).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        this.loggedUserDataService.setUserData(res.user);
      })
    );
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
}
