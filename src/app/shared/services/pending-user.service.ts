import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {PendingUser} from '../models/pending-user.model';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PendingUserService {

  protected readonly http = inject(HttpClient);

  createRequest(pendingUser: PendingUser): Observable<PendingUser>{
    return this.http.post<PendingUser>(`${environment.apiUrl}/pending-user/request`, pendingUser);
  }

  getPendingUsers(): Observable<PendingUser[]>{
    return this.http.get<PendingUser[]>(`${environment.apiUrl}/pending-user/admin/all`);
  }

  createUserFromRequest(pendingUser: PendingUser): Observable<PendingUser>{
    return this.http.post<PendingUser>(`${environment.apiUrl}/pending-user/admin/create-user`, pendingUser);
  }

  deletePendingUser(pendingUser: PendingUser): Observable<any>{
    return this.http.put<any>(`${environment.apiUrl}/pending-user/admin/delete`, pendingUser);
  }
}
