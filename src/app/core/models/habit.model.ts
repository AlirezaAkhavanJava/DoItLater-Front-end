// ============================================================
//  Domain + API types for Habits
// ============================================================

export type HabitColor = 'blue' | 'green' | 'orange' | 'red';
export type HabitPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface HabitEntryDto {
  id: number;
  entryDate: string;
  completed: boolean;
  note: string | null;
}

export interface HabitDto {
  id: number;
  name: string;
  description: string | null;
  priority: HabitPriority;
  createdDate: string;
  entries: HabitEntryDto[];
  completedCount: number;
  totalDays: number;
  completionRate: number;
}

export interface WeekGridDto {
  weekStart: string;
  weekEnd: string;
  dateRangeDisplay: string;
  days: string[];
  habits: HabitDto[];
}

export interface CreateHabitRequestDto {
  name: string;
  priority: HabitPriority;
  description?: string | null;
}

export interface UpdateHabitRequestDto {
  name: string;
  priority: HabitPriority;
  description?: string | null;
}

export interface ToggleHabitEntryRequestDto {
  entryDate: string;
  completed: boolean;
  note?: string | null;
}

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  color: HabitColor;
  priority: HabitPriority;
  completedCount: number;
  failedCount: number;
  history: boolean[];
}