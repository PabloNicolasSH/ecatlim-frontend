import {HttpContextToken, HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from './auth.service';
import {catchError, Observable, switchMap, throwError} from 'rxjs';
import {MessageService} from 'primeng/api';

export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

/** Login, second factor, refresh and logout are called without a session, so they never carry the access token. */
const isAuthEndpoint = (req: HttpRequest<unknown>) => req.url.includes('/auth/');

const withToken = (req: HttpRequest<unknown>, token: string | null) =>
  token ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}}) : req;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const messageService = inject(MessageService);

  const showError = (err: HttpErrorResponse) => {
    if (req.context.get(SILENT_ERRORS)) {
      return;
    }
    messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: err?.error?.ecatlimMessage ?? "Ha ocurrido un error inesperado"
    });
  };

  if (isAuthEndpoint(req)) {
    return next(req).pipe(
      catchError((err: HttpErrorResponse) => {
        showError(err);
        return throwError(() => err);
      })
    );
  }

  const endSession = (err: HttpErrorResponse): Observable<never> => {
    authService.logout();
    if (!err?.error?.ecatlimMessage) {
      messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: "Vuelva a iniciar sesión"
      });
      return throwError(() => err);
    }
    showError(err);
    return throwError(() => err);
  };

  /** An expired access token is renewed with the refresh token and the request is repeated once. */
  const renewAndRetry = (err: HttpErrorResponse, next: HttpHandlerFn): Observable<any> => {
    if (!authService.getRefreshToken()) {
      return endSession(err);
    }
    return authService.refresh().pipe(
      catchError(() => endSession(err)),
      switchMap(token => next(withToken(req, token)).pipe(
        catchError((retryErr: HttpErrorResponse) => {
          if (retryErr.status === 401) {
            return endSession(retryErr);
          }
          showError(retryErr);
          return throwError(() => retryErr);
        })
      ))
    );
  };

  return next(withToken(req, authService.getToken())).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return renewAndRetry(err, next);
      }
      showError(err);
      return throwError(() => err);
    })
  );
};
