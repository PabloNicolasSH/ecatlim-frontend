import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {DashboardData} from './dashboard-data.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  protected readonly http = inject(HttpClient);

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${environment.apiUrl}/dashboard`);
  }
}
