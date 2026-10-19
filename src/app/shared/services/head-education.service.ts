import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HeadEducationEvent, HeadEducationMember, HeadEducationMemberHistory} from '../models/head-education.model';

@Injectable({
  providedIn: 'root'
})
export class HeadEducationService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/head-education`;

  getMembers(): Observable<HeadEducationMember[]> {
    return this.http.get<HeadEducationMember[]>(`${this.baseUrl}/members`);
  }

  getMemberHistory(memberId: number): Observable<HeadEducationMemberHistory> {
    return this.http.get<HeadEducationMemberHistory>(`${this.baseUrl}/members/${memberId}/history`);
  }

  activateMember(memberId: number): Observable<HeadEducationMember> {
    return this.http.put<HeadEducationMember>(`${this.baseUrl}/members/${memberId}/activate`, {});
  }

  deactivateMember(memberId: number): Observable<HeadEducationMember> {
    return this.http.put<HeadEducationMember>(`${this.baseUrl}/members/${memberId}/deactivate`, {});
  }

  getEvents(): Observable<HeadEducationEvent[]> {
    return this.http.get<HeadEducationEvent[]>(`${this.baseUrl}/events`);
  }
}
