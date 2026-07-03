import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {BehaviorSubject, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  protected readonly http = inject(HttpClient)
  protected readonly sanitizer = inject(DomSanitizer);

  private objectUrl: string | null = null;
  private avatarSource = new BehaviorSubject<SafeUrl | null>(null);
  public avatarUrl$: Observable<SafeUrl | null> = this.avatarSource.asObservable();

  public loadAvatar(apiPath: string): void {
    const thumbnailUrl = `${environment.apiUrl}${apiPath.replace('/files/', '/files/thumbnail/')}`;

    this.http.get(thumbnailUrl, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
        }

        this.objectUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);

        this.avatarSource.next(safeUrl);
      },
      error: (err) => {
        console.error('Error al descargar el avatar en el servicio:', err);
        this.avatarSource.next(null);
      }
    });
  }

  public getLatestAvatar(): SafeUrl | null {
    return this.avatarSource.getValue();
  }

  public clearAvatar(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.avatarSource.next(null);
  }
}
