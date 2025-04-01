import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../models/user.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  protected readonly http = inject(HttpClient);

  getUsers(): Observable<User[]>{
    return this.http.get<User[]>(`${environment.apiUrl}/user/admin/all`);
  }
}
