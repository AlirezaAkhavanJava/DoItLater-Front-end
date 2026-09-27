import { Routes } from '@angular/router';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
  },
];

export const SIGNUP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./signup/signup').then((m) => m.SignupComponent),
  },
];