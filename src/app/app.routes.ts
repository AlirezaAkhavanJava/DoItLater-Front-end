import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // ---- Default redirect ----
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'habits',
  },

  // ---- Auth ----
  {
    path: 'login',
    loadChildren: () =>
      import('../app/features/auth/auth.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'signup',
    loadChildren: () =>
      import('../app/features/auth/auth.routes').then((m) => m.SIGNUP_ROUTES),
  },

  // ---- Habits (protected) ----
  {
    path: 'habits',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/habits/habits.routes').then((m) => m.HABITS_ROUTES),
  },

  // ---- Tasks (protected) ----
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES),
  },

  // ---- Fallback ----
  {
    path: '**',
    redirectTo: 'habits',
  },
];