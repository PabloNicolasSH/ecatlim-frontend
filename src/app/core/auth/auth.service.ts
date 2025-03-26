import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserToLog} from './user-to-log.model';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';

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
      })
    )
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
