import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../models/user.model';
import {environment} from '../../../environments/environment';
import {UserForm} from '../models/user-form.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  protected readonly http = inject(HttpClient);

  getUsers(): Observable<User[]>{
    return this.http.get<User[]>(`${environment.apiUrl}/user/admin/allActives`);
  }

  getInactiveUsers(): Observable<User[]>{
    return this.http.get<User[]>(`${environment.apiUrl}/user/admin/allInactives`);
  }

  addUser(user: UserForm): Observable<User>{
    return this.http.post<User>(`${environment.apiUrl}/user/admin/add`, user);
  }

  updateUser(id: number, user: UserForm): Observable<User>{
    return this.http.put<User>(`${environment.apiUrl}/user/admin/edit/${id}`, user);
  }

  deactivateUser(id: number): Observable<User> {
    return this.http.delete<User>(`${environment.apiUrl}/user/admin/deactivate/${id}`);
  }

  activateUser(id: number): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/user/admin/activate/${id}`, {});
  }

  forgotPassword(username: string): Observable<void>{
    return this.http.get<void>(`${environment.apiUrl}/`)
  }
}
