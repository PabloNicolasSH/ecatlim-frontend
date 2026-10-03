import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpContext} from '@angular/common/http';
import {SILENT_ERRORS} from '../../core/auth/token.interceptor';
import {Observable} from 'rxjs';
import {LearningResource} from '../models/learning-resource.model';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  protected readonly http = inject(HttpClient);

  getAll(): Observable<LearningResource[]> {
    return this.http.get<LearningResource[]>(`${environment.apiUrl}/learning-resources`);
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/learning-resources/${id}/download`, {
      responseType: 'blob'
    });
  }

  thumbnail(id: number, version: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/learning-resources/${id}/thumbnail`, {
      params: {v: version},
      context: new HttpContext().set(SILENT_ERRORS, true),
      responseType: 'blob'
    });
  }

  registerOpen(id: number): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/learning-resources/${id}/open`, null);
  }

  upload(formData: FormData): Observable<LearningResource> {
    return this.http.post<LearningResource>(`${environment.apiUrl}/learning-resources/add`, formData);
  }

  update(id: number, formData: FormData): Observable<LearningResource> {
    return this.http.put<LearningResource>(`${environment.apiUrl}/learning-resources/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/learning-resources/${id}`);
  }
}
