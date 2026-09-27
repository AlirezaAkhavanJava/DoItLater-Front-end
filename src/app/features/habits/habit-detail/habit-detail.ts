import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HabitService } from '../../../core/services/habit.service';
import { HabitDto, HabitPriority } from '../../../core/models/habit.model';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge';

const HEATMAP_WEEKS = 52;
const COLOR_CYCLE = ['blue', 'green', 'orange', 'red'] as const;
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface HeatmapCell {
  iso: string;
  level: number;
  tooltip: string;
  hidden: boolean;
}

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ThemeToggleComponent, PriorityBadgeComponent],
  templateUrl: './habit-detail.html',
  styleUrl: './habit-detail.scss',
})
export class HabitDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private habitService = inject(HabitService);

  // ---- State ----
  protected readonly habit = signal<HabitDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly colorDot = signal<string>('blue');
  protected readonly completedCount = signal(0);
  protected readonly failedCount = signal(0);
  protected readonly totalDays = signal(0);
  protected readonly completionRate = signal('0%');

  // ---- Heatmap state ----
  protected readonly heatmapCells = signal<HeatmapCell[]>([]);
  protected readonly heatmapMonthLabels = signal<{ label: string; col: number }[]>([]);

  // ---- Edit modal ----
  protected readonly editOpen = signal(false);
  protected readonly editModel = signal({
    name: '', description: '', priority: 'MEDIUM' as HabitPriority,
  });
  protected readonly editError = signal<string | null>(null);
  protected readonly editSaving = signal(false);

  // ---- Delete modal ----
  protected readonly deleteOpen = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly deleteSaving = signal(false);

  private habitId = 0;

  ngOnInit(): void {
    this.habitId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  // ---- Formatters ----
  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ---- Actions ----
  openEdit(): void {
    const h = this.habit();
    if (!h) return;
    this.editModel.set({
      name: h.name,
      description: h.description ?? '',
      priority: h.priority,
    });
    this.editError.set(null);
    this.editOpen.set(true);
  }

  closeEdit(): void { this.editOpen.set(false); }

  saveEdit(): void {
    const m = this.editModel();
    const name = m.name.trim();
    if (!name) { this.editError.set('Please enter a habit name.'); return; }

    this.editSaving.set(true);
    this.editError.set(null);

    this.habitService
      .update(this.habitId, {
        name,
        priority: m.priority,
        description: m.description.trim() || null,
      })
      .subscribe({
        next: (updated) => {
          this.habit.set(updated);
          this.applyStats(updated);
          this.closeEdit();
        },
        error: (err) => {
          this.editError.set(err?.error?.message ?? err?.message ?? 'Failed to update.');
          this.editSaving.set(false);
        },
        complete: () => this.editSaving.set(false),
      });
  }

  openDelete(): void { this.deleteError.set(null); this.deleteOpen.set(true); }
  closeDelete(): void { this.deleteOpen.set(false); }

  confirmDelete(): void {
    this.deleteSaving.set(true);
    this.deleteError.set(null);

    this.habitService.delete(this.habitId).subscribe({
      next: () => this.router.navigateByUrl('/habits'),
      error: (err) => {
        this.deleteError.set(err?.error?.message ?? err?.message ?? 'Failed to delete.');
        this.deleteSaving.set(false);
      },
    });
  }

  // ---- Data loading ----
  private load(): void {
    if (!Number.isFinite(this.habitId) || this.habitId <= 0) {
      this.errorMessage.set('Invalid habit id in URL.');
      this.loading.set(false);
      return;
    }

    this.habitService.getById(this.habitId).subscribe({
      next: (h) => {
        this.habit.set(h);
        this.colorDot.set(COLOR_CYCLE[h.id % COLOR_CYCLE.length]);
        this.applyStats(h);
        this.buildHeatmap(h);
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 404) this.errorMessage.set(`Habit ${this.habitId} was not found.`);
        else this.errorMessage.set(err?.message ?? 'Failed to load habit.');
        this.loading.set(false);
      },
    });
  }

  private applyStats(h: HabitDto): void {
    const completed = h.completedCount ?? 0;
    const total = h.totalDays ?? 0;
    const failed = Math.max(0, total - completed);
    const rate = total === 0 ? 0 : (completed * 100) / total;

    this.completedCount.set(completed);
    this.failedCount.set(failed);
    this.totalDays.set(total);
    this.completionRate.set(`${rate.toFixed(1)}%`);
  }

  private buildHeatmap(h: HabitDto): void {
    const completedDates = new Set(
      (h.entries ?? []).filter((e) => e.completed).map((e) => e.entryDate),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonday = new Date(today);
    const dow = (currentMonday.getDay() + 6) % 7;
    currentMonday.setDate(currentMonday.getDate() - dow);

    const startMonday = new Date(currentMonday);
    startMonday.setDate(startMonday.getDate() - (HEATMAP_WEEKS - 1) * 7);

    const cells: HeatmapCell[] = [];
    const monthPerCol: number[] = [];

    for (let w = 0; w < HEATMAP_WEEKS; w++) {
      const weekStart = new Date(startMonday);
      weekStart.setDate(startMonday.getDate() + w * 7);
      monthPerCol.push(weekStart.getMonth());

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(weekStart);
        cellDate.setDate(weekStart.getDate() + d);
        const iso = this.toIso(cellDate);
        const isFuture = cellDate > today;

        cells.push({
          iso,
          level: isFuture ? -1 : completedDates.has(iso) ? 4 : 0,
          tooltip: `${iso} — ${completedDates.has(iso) ? 'completed' : 'not completed'}`,
          hidden: isFuture,
        });
      }
    }
    this.heatmapCells.set(cells);

    // Month labels
    const labels: { label: string; col: number }[] = [];
    const MIN_COL_GAP = 3;
    let lastLabelCol = -Infinity;

    for (let w = 0; w < HEATMAP_WEEKS; w++) {
      const month = monthPerCol[w];
      const prevMonth = w > 0 ? monthPerCol[w - 1] : null;
      if (month === prevMonth) continue;
      if (w - lastLabelCol < MIN_COL_GAP) continue;

      labels.push({ label: MONTH_LABELS[month], col: w + 1 });
      lastLabelCol = w;
    }
    this.heatmapMonthLabels.set(labels);
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}