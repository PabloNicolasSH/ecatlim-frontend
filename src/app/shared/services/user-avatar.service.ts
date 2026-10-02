import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, map, Observable, of, shareReplay} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserAvatarService {

  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<string | null>>();

  getAvatar(avatarUrl: string): Observable<string | null> {
    let avatar$ = this.cache.get(avatarUrl);

    if (!avatar$) {
      const thumbnailUrl = `${environment.apiUrl}${avatarUrl.replace('/files/', '/files/thumbnail/')}`;
      avatar$ = this.http.get(thumbnailUrl, {responseType: 'blob'}).pipe(
        map(blob => URL.createObjectURL(blob)),
        catchError(() => of(null)),
        shareReplay(1)
      );
      this.cache.set(avatarUrl, avatar$);
    }

    return avatar$;
  }
}
