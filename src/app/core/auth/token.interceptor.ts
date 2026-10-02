import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from './auth.service';
import {catchError} from 'rxjs';
import {MessageService} from 'primeng/api';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const messageService = inject(MessageService);

  const authReq = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401) {
        authService.logout();
        if (!err?.error?.ecatlimMessage) {
          messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: "Vuelva a iniciar sesión"
          });
          throw err;
        }
      }
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.error?.ecatlimMessage ?? "Ha ocurrido un error inesperado"
      });
      throw err;
    })
  );
};
