import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./task-list/task-list').then((m) => m.TaskListComponent),
  },
];