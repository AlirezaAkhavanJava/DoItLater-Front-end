import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'habits' },
  {
    path: 'habits',
    loadChildren: () =>
      import('./features/habits/habits.routes').then((m) => m.HABITS_ROUTES),
  },
  {
    path: 'tasks',
    loadChildren: () =>
      import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES),
  },
  { path: '**', redirectTo: 'habits' },
];