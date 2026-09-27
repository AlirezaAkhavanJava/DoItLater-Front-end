import { Routes } from '@angular/router';

export const HABITS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./habit-tracker/habit-tracker').then((m) => m.HabitTrackerComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./habit-detail/habit-detail').then((m) => m.HabitDetailComponent),
  },
];