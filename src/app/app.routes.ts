import { Routes } from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {RegisterRequestComponent} from './features/register-request/register-request.component';

export const routes: Routes = [
  {
    path: "",
    component: LoginComponent
  },
  {
    path: "register",
    component: RegisterRequestComponent
  }
];
