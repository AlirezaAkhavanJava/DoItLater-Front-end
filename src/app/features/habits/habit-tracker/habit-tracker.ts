import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../../core/services/habit.service';
import { Habit, HabitPriority } from '../../../core/models/habit.model';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge';

const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLOR_CYCLE = ['blue', 'green', 'orange', 'red'] as const;

@Component({
  selector: 'app-habit-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ThemeToggleComponent, PriorityBadgeComponent],
  templateUrl: './habit-tracker.html',
  styleUrl: './habit-tracker.scss',
})
export class HabitTrackerComponent implements OnInit {
  private habitService = inject(HabitService);

  // ---- State ----
  protected readonly habits = signal<Habit[]>([]);
  protected readonly days = signal<string[]>([]);
  protected readonly dateRangeDisplay = signal<string>('');
  protected readonly weekStart = signal<Date>(this.computeInitialStart());

  // ---- Modal state ----
  protected readonly modalOpen = signal(false);
  protected readonly newHabit = signal({
    name: '',
    description: '',
    priority: 'MEDIUM' as HabitPriority,
  });
  protected readonly formError = signal<string | null>(null);
  protected readonly saving = signal(false);

  // ---- Computed ----
  protected readonly todayIso = computed(() => this.toIso(new Date()));

  ngOnInit(): void {
    this.loadWeek(this.weekStart());
  }

  // ---- Week navigation ----
  prevWeek(): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() - DAYS_IN_WEEK);
    this.weekStart.set(d);
    this.loadWeek(d);
  }

  nextWeek(): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + DAYS_IN_WEEK);
    this.weekStart.set(d);
    this.loadWeek(d);
  }

  // ---- Helpers exposed to template ----
  dayLabel(iso: string): string {
    return DAY_LABELS[this.parseIso(iso).getDay()];
  }

  dayNumber(iso: string): number {
    return this.parseIso(iso).getDate();
  }

  isToday(iso: string): boolean {
    return iso === this.todayIso();
  }

  // ---- Actions ----
  toggleHabit(habit: Habit, dayIndex: number): void {
    const iso = this.days()[dayIndex];
    if (!iso || iso !== this.todayIso()) return;

    const next = !habit.history[dayIndex];

    // Optimistic update
    this.habits.update((list) =>
      list.map((h) =>
        h.id === habit.id
          ? { ...h, history: h.history.map((v, i) => (i === dayIndex ? next : v)) }
          : h,
      ),
    );

    this.habitService
      .toggleEntry(habit.id, { entryDate: iso, completed: next, note: null })
      .subscribe({
        next: () => this.loadWeek(this.weekStart()),
        error: (err) => {
          console.error('Toggle failed:', err);
          // Rollback
          this.habits.update((list) =>
            list.map((h) =>
              h.id === habit.id
                ? { ...h, history: h.history.map((v, i) => (i === dayIndex ? !next : v)) }
                : h,
            ),
          );
        },
      });
  }

  openModal(): void {
    this.newHabit.set({ name: '', description: '', priority: 'MEDIUM' });
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  saveHabit(): void {
    const { name, description, priority } = this.newHabit();
    const trimmed = name.trim();

    if (!trimmed) {
      this.formError.set('Please enter a habit name.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    this.habitService
      .create({
        name: trimmed,
        priority,
        description: description.trim() || null,
      })
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadWeek(this.weekStart());
        },
        error: (err) => {
          this.formError.set(err?.error?.message ?? err?.message ?? 'Failed to create habit.');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
  }

  // ---- Data loading ----
  private loadWeek(start: Date): void {
    const iso = this.toIso(start);

    this.habitService.getWeek(iso).subscribe({
      next: (grid) => {
        this.days.set(grid.days);
        this.dateRangeDisplay.set(grid.dateRangeDisplay);

        const mapped: Habit[] = grid.habits.map((dto) => {
          const completedCount = dto.completedCount ?? 0;
          const totalDays = dto.totalDays ?? 0;
          const failedCount = Math.max(0, totalDays - completedCount);

          return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            priority: dto.priority,
            color: COLOR_CYCLE[dto.id % COLOR_CYCLE.length],
            completedCount,
            failedCount,
            history: this.buildHistory(grid.days, dto.entries),
          };
        });

        this.habits.set(mapped);
      },
      error: (err) => console.error('Failed to load week:', err),
    });
  }

  private buildHistory(days: string[], entries: { entryDate: string; completed: boolean }[]): boolean[] {
    const history = new Array(days.length).fill(false);
    for (const e of entries) {
      const idx = days.indexOf(e.entryDate);
      if (idx >= 0) history[idx] = e.completed;
    }
    return history;
  }

  private computeInitialStart(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (DAYS_IN_WEEK - 1));
    return start;
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseIso(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}