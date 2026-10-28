import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, finalize, map, Observable, of, shareReplay, tap, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
import {AuthLoginResponse, MfaSetup, UserToLog} from './auth-models';
import {LoggedUserDataService} from './logged-user-data-service';
import {WebsocketService} from '../../shared/services/websocket.service';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const PASSWORD_CHANGE_KEY = 'passwordChangeRequired';

/** The access token is renewed this long before it expires. */
const REFRESH_MARGIN_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly websocketService = inject(WebsocketService);
  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router);
  protected readonly loggedUserDataService = inject(LoggedUserDataService);

  private refreshInFlight$: Observable<string> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (this.isAuthenticated()) {
      if (!this.isPasswordChangeRequired()) {
        this.websocketService.initConnection(() => this.getToken());
      }
      this.scheduleRefresh();
    }
  }

  /** First step. A session is opened right away unless the user has to go through the second factor. */
  login(userToLog: UserToLog): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${environment.apiUrl}/auth/login`, userToLog).pipe(
      tap(res => this.openSessionIfAuthenticated(res))
    );
  }

  verifyMfa(challengeToken: string, code: string): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${environment.apiUrl}/auth/mfa/verify`, {challengeToken, code}).pipe(
      tap(res => this.openSessionIfAuthenticated(res))
    );
  }

  beginMfaSetup(challengeToken: string): Observable<MfaSetup> {
    return this.http.post<MfaSetup>(`${environment.apiUrl}/auth/mfa/setup`, {challengeToken});
  }

  confirmMfaSetup(challengeToken: string, code: string): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${environment.apiUrl}/auth/mfa/setup/confirm`, {challengeToken, code}).pipe(
      tap(res => this.openSessionIfAuthenticated(res))
    );
  }

  /**
   * Renews the session. Calls made together share one request, because every refresh token works only once. If it
   * fails because another tab renewed the session first, it retries with the token that tab stored.
   */
  refresh(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    const used = this.getRefreshToken();
    if (!used) {
      return throwError(() => new Error('No refresh token'));
    }

    this.refreshInFlight$ = this.requestRefresh(used).pipe(
      catchError(err => {
        const stored = this.getRefreshToken();
        return stored && stored !== used ? this.requestRefresh(stored) : throwError(() => err);
      }),
      map(res => res.token!),
      finalize(() => this.refreshInFlight$ = null),
      shareReplay({bufferSize: 1, refCount: false})
    );
    return this.refreshInFlight$;
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {refreshToken}).pipe(catchError(() => of(null))).subscribe();
    }
    this.clearSession();
    this.router.navigateByUrl('/login');
  }

  /** Forgets the session on this device without telling the server, which already closed it. */
  clearSession() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(PASSWORD_CHANGE_KEY);
    localStorage.removeItem('me');
    this.websocketService.disconnect();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  isPasswordChangeRequired(): boolean {
    return localStorage.getItem(PASSWORD_CHANGE_KEY) === 'true';
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private requestRefresh(refreshToken: string): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${environment.apiUrl}/auth/refresh`, {refreshToken}).pipe(
      tap(res => this.storeSession(res, false))
    );
  }

  private openSessionIfAuthenticated(res: AuthLoginResponse) {
    if (res.status === 'AUTHENTICATED') {
      this.storeSession(res, true);
    }
  }

  private storeSession(res: AuthLoginResponse, newLogin: boolean) {
    localStorage.setItem(TOKEN_KEY, res.token!);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken!);
    localStorage.setItem(PASSWORD_CHANGE_KEY, String(res.passwordChangeRequired));
    if (res.user) {
      this.loggedUserDataService.setUserData(res.user);
    }
    if (newLogin && !res.passwordChangeRequired) {
      this.websocketService.initConnection(() => this.getToken());
    }
    if (!newLogin && res.passwordChangeRequired) {
      // The password expired while the session was open
      this.websocketService.disconnect();
      this.router.navigateByUrl('/cambiar-contraseña');
    }
    this.scheduleRefresh();
  }

  private scheduleRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    const lifetime = this.tokenLifetime(this.getToken());
    if (lifetime === null) {
      return;
    }
    // Short-lived tokens are renewed a quarter of their life before expiring, so the timer never spins
    const margin = Math.min(REFRESH_MARGIN_MS, (lifetime.expiresAt - lifetime.issuedAt) / 4);
    const delay = Math.max(lifetime.expiresAt - Date.now() - margin, 0);
    this.refreshTimer = setTimeout(() => {
      this.refresh().subscribe({error: () => this.logout()});
    }, delay);
  }

  private tokenLifetime(token: string | null): { issuedAt: number; expiresAt: number } | null {
    try {
      const payload = JSON.parse(atob(token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && typeof payload.iat === 'number'
        ? {issuedAt: payload.iat * 1000, expiresAt: payload.exp * 1000}
        : null;
    } catch {
      return null;
    }
  }
}
