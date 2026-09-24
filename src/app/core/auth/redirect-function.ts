import {RedirectFunction} from "@angular/router";
import {AuthService} from './auth.service';
import {inject} from "@angular/core";

export const baseRedirect: RedirectFunction = () => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return '/app/home';
  } else {
    return '/login';
  }
};
