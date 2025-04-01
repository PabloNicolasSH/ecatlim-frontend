import { Routes } from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {RegisterRequestComponent} from './features/register-request/register-request.component';
import {MainComponent} from './core/main/main.component';
import {authGuard} from './core/auth/auth.guard';
import {HomeComponent} from './features/home/home.component';
import {redirect, redirectGuard} from './core/auth/redirect.guard';
import {UserProfileComponent} from './features/user-profile/user-profile.component';
import {UserListComponent} from './features/user-list/user-list.component';

export const routes: Routes = [
  {
    path: "login",
    component: LoginComponent
  },
  {
    path: "register",
    component: RegisterRequestComponent
  },
  {
    path: "app",
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "home",
        component: HomeComponent
      },
      {
        path: "profile",
        component: UserProfileComponent
      },
      {
        path: "users",
        component: UserListComponent
      }
    ]
  },
  {
    path: "**",
    redirectTo: redirect
  }
];
