import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpContext} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SILENT_ERRORS} from '../../core/auth/token.interceptor';
import {News} from '../models/news.model';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  protected readonly http = inject(HttpClient);

  getLatest(page: number, size: number): Observable<News[]> {
    return this.http.get<News[]>(`${environment.apiUrl}/news`, {params: {page, size}});
  }

  create(formData: FormData): Observable<News> {
    return this.http.post<News>(`${environment.apiUrl}/news`, formData);
  }

  update(id: number, formData: FormData): Observable<News> {
    return this.http.put<News>(`${environment.apiUrl}/news/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/news/${id}`);
  }

  addAttachment(id: number, file: File): Observable<News> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<News>(`${environment.apiUrl}/news/${id}/attachments`, formData);
  }

  removeAttachment(id: number, attachmentId: number): Observable<News> {
    return this.http.delete<News>(`${environment.apiUrl}/news/${id}/attachments/${attachmentId}`);
  }

  image(id: number, thumbnail: boolean): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/news/${id}/image${thumbnail ? '/thumbnail' : ''}`, {
      context: new HttpContext().set(SILENT_ERRORS, true),
      responseType: 'blob'
    });
  }

  downloadAttachment(id: number, attachmentId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/news/${id}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    });
  }
}
