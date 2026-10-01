import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../auth.service';
import {Role} from '../../../shared/models/role.model';
import {LoggedUserDataService} from '../logged-user-data-service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const loggedUserDataService = inject(LoggedUserDataService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.parseUrl("/login");
  }

  const roles: Role[] | undefined = route.data["roles"];
  if (roles && roles.length > 0 && !loggedUserDataService.hasAnyRole(...roles)) {
    return router.parseUrl("/app/home");
  }

  return true;
};
