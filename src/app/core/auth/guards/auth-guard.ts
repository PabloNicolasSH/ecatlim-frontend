import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../auth.service';
import {Role} from '../../../shared/models/role.model';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.parseUrl("/login");
  }

  const roles: Role[] | undefined = route.data["roles"];
  if (roles && roles.length > 0 && !authService.getProfile().roles.some(role => roles.includes(role))) {
    return router.parseUrl("/app/home");
  }

  return true;
};
