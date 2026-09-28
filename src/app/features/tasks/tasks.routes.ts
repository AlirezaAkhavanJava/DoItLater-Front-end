import { Routes } from '@angular/router';
import { TaskListComponent } from './task-list/task-list';

export const TASKS_ROUTES: Routes = [
  { path: '', component: TaskListComponent },
];