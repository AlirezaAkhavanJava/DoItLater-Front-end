import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HabitService } from '../../../core/services/habit.service';
import {
  Habit,
  HabitColor,
  HabitDto,
  HabitPriority,
  WeekGridDto,
} from '../../../core/models/habit.model';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge';

const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLOR_CYCLE: HabitColor[] = ['blue', 'green', 'orange', 'red'];

@Component({
  selector: 'app-habit-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent, PriorityBadgeComponent],
  templateUrl: './habit-tracker.html',
  styleUrl: './habit-tracker.scss',
})
export class HabitTrackerComponent implements OnInit {
  private habitService = inject(HabitService);

  readonly dayLabels = DAY_LABELS;

  today = this.startOfToday();
  currentStartDate = this.startOfWeekWindow(this.today);

  days = signal<string[]>([]);
  habits = signal<Habit[]>([]);
  dateRangeDisplay = signal<string>('');

  // modal state
  modalOpen = signal(false);
  formName = signal('');
  formDescription = signal('');
  formPriority = signal<HabitPriority>('MEDIUM');
  formError = signal<string | null>(null);
  saving = signal(false);

  ngOnInit(): void {
    void this.fetchWeek();
  }

  // ---------- helpers (same logic as app.js) ----------
  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private startOfWeekWindow(base: Date): Date {
    const d = new Date(base);
    d.setDate(d.getDate() - (DAYS_IN_WEEK - 1));
    return d;
  }

  toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  parseISODate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  isDateToday(date: Date): boolean {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  dayLabel(iso: string): string {
    return DAY_LABELS[this.parseISODate(iso).getDay()];
  }

  dayNumber(iso: string): number {
    return this.parseISODate(iso).getDate();
  }

  isTodayIso(iso: string): boolean {
    return this.isDateToday(this.parseISODate(iso));
  }

  private pickColor(id: number): HabitColor {
    return COLOR_CYCLE[id % COLOR_CYCLE.length];
  }

  private buildHistory(days: string[], entries: { entryDate: string; completed: boolean }[]): boolean[] {
    const history = new Array(days.length).fill(false);
    for (const e of entries) {
      const idx = days.indexOf(e.entryDate);
      if (idx >= 0) history[idx] = e.completed;
    }
    return history;
  }

  private mapDtoToHabit(dto: HabitDto, days: string[]): Habit {
    const completedCount = dto.completedCount ?? 0;
    const totalDays = dto.totalDays ?? 0;
    const failedCount = Math.max(0, totalDays - completedCount);

    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      priority: dto.priority,
      color: this.pickColor(dto.id),
      completedCount,
      failedCount,
      history: this.buildHistory(days, dto.entries ?? []),
    };
  }

  // ---------- data ----------
  async fetchWeek(): Promise<void> {
    try {
      const grid: WeekGridDto = await this.habitService.getWeek(this.toISODate(this.currentStartDate));
      this.days.set(grid.days);
      this.dateRangeDisplay.set(grid.dateRangeDisplay);
      this.habits.set(grid.habits.map((d) => this.mapDtoToHabit(d, grid.days)));
    } catch (err) {
      console.error('Failed to load week:', err);
    }
  }

  async toggleHabit(habitId: number, dayIndex: number): Promise<void> {
    const list = this.habits();
    const habit = list.find((h) => h.id === habitId);
    if (!habit) return;

    const iso = this.days()[dayIndex];
    if (!iso) return;
    if (iso !== this.toISODate(new Date())) return;

    const next = !habit.history[dayIndex];

    // optimistic update
    habit.history[dayIndex] = next;
    this.habits.set([...list]);

    try {
      await this.habitService.toggleEntry(habitId, {
        entryDate: iso,
        completed: next,
        note: null,
      });
      await this.fetchWeek();
    } catch (err) {
      habit.history[dayIndex] = !next;
      this.habits.set([...list]);
      console.error('Toggle failed:', err);
    }
  }

  // ---------- week nav ----------
  prevWeek(): void {
    this.currentStartDate.setDate(this.currentStartDate.getDate() - DAYS_IN_WEEK);
    void this.fetchWeek();
  }

  nextWeek(): void {
    this.currentStartDate.setDate(this.currentStartDate.getDate() + DAYS_IN_WEEK);
    void this.fetchWeek();
  }

  // ---------- modal ----------
  openModal(): void {
    this.formName.set('');
    this.formDescription.set('');
    this.formPriority.set('MEDIUM');
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async submitHabit(): Promise<void> {
    const name = this.formName().trim();
    if (!name) {
      this.formError.set('Please enter a habit name.');
      return;
    }
    const description = this.formDescription().trim() || null;
    const priority = this.formPriority();

    this.saving.set(true);
    this.formError.set(null);

    try {
      await this.habitService.create({ name, priority, description });
      this.closeModal();
      await this.fetchWeek();
    } catch (err) {
      this.formError.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.saving.set(false);
    }
  }
}