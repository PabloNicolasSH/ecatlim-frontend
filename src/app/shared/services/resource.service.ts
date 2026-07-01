import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {LearningResource} from '../models/learning-resource.model';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  protected readonly http = inject(HttpClient);

  getAll(): Observable<LearningResource[]> {
    return this.http.get<LearningResource[]>(`${environment.apiUrl}`);
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  upload(formData: FormData): Observable<LearningResource> {
    return this.http.post<LearningResource>(`${environment.apiUrl}/add`, formData);
  }
}
