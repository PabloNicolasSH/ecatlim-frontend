import {CanActivateFn, RedirectFunction, Router} from '@angular/router';
import {AuthService} from './auth.service';
import {inject} from '@angular/core';

export const redirectGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    router.navigateByUrl('/app/home');
  } else {
    router.navigateByUrl('/login');
  }

  return false;
};

export const redirect: RedirectFunction = () => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return '/app/home';
  } else {
    return '/login';
  }
};
