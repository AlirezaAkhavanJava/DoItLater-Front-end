import { Routes } from '@angular/router';
import { HabitTrackerComponent } from './habit-tracker/habit-tracker';
import { HabitDetailComponent } from './habit-detail/habit-detail';

export const HABITS_ROUTES: Routes = [
  { path: '', component: HabitTrackerComponent },
  { path: ':id', component: HabitDetailComponent },
];