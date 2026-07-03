import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../models/user.model';
import {environment} from '../../../environments/environment';
import {UserForm} from '../models/user-form.model';
import {ResetPassword} from '../../features/reset-password/models/reset-password.model';
import {UserMeForm} from '../models/user-me-form.model';
import {ChangePassword} from '../../features/reset-password/models/change-password.model';
import {Role} from '../models/role.model';

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

  forgotPassword(email: string): Observable<void>{
    return this.http.get<void>(`${environment.apiUrl}/password/forgot`, {params: {email: email}});
  }

  resetPassword(newPassword: ResetPassword): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/password/reset`, newPassword);
  }

  changePassword(newPassword: ChangePassword): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/password/change-password`, newPassword);
  }

  updateMyInfo(userMe: UserMeForm): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/user/update/me`, userMe)
  }

  getMyInfo(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/user/me`);
  }

  getUsersByRole(role: Role) {
    return this.http.get<User[]>(`${environment.apiUrl}/user/admin/all/${role}`);
  }

  uploadAvatar(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users/me/files/avatar`, formData);
  }

  downloadSecureFile(fileUrl: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}${fileUrl}`, { responseType: 'blob' });
  }
}
