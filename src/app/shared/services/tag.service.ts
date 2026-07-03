import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {LRTag} from '../models/learning-resource.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  protected readonly http = inject(HttpClient)

  getTags(): Observable<LRTag[]> {
    return this.http.get<LRTag[]>(`${environment.apiUrl}/tags`);
  }

  createTag(newName: string): Observable<LRTag> {
    return this.http.post<LRTag>(`${environment.apiUrl}/tags/add`, newName)
  }
}
