import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HabitService } from '../../../core/services/habit.service';
import { HabitDto, HabitPriority } from '../../../core/models/habit.model';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge';

const HEATMAP_WEEKS = 52;
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLOR_CYCLE = ['blue','green','orange','red'] as const;

interface HeatmapCell {
  visible: boolean;
  level: number;
  tooltip: string;
}

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent, PriorityBadgeComponent],
  templateUrl: './habit-detail.html',
  styleUrl: './habit-detail.scss',
})
export class HabitDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private habitService = inject(HabitService);

  habitId!: number;
  habit: HabitDto | null = null;

  loading = true;
  error: string | null = null;

  color: string = 'blue';
  completedCount = 0;
  failedCount = 0;
  totalDays = 0;
  rate = 0;

  heatmapCells: HeatmapCell[] = [];
  monthLabels: { text: string; col: number }[] = [];

  // edit modal
  editOpen = false;
  editName = '';
  editDescription = '';
  editPriority: HabitPriority = 'MEDIUM';
  editError: string | null = null;
  editSaving = false;

  // delete modal
  deleteOpen = false;
  deleteDisplayName = '';
  deleteError: string | null = null;
  deleteSaving = false;

  ngOnInit(): void {
    this.habitId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(this.habitId) || this.habitId <= 0) {
      this.error = 'Invalid habit id in URL.';
      this.loading = false;
      return;
    }
    void this.fetchHabit();
  }

  // ---------- helpers ----------
  private pickColor(id: number): string {
    return COLOR_CYCLE[id % COLOR_CYCLE.length];
  }

  toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatDate(isoDateTime: string | null): string {
    if (!isoDateTime) return '—';
    return new Date(isoDateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // ---------- data ----------
  async fetchHabit(): Promise<void> {
    try {
      const dto = await this.habitService.getById(this.habitId);
      this.habit = dto;
      this.color = this.pickColor(dto.id);

      const completedCount = dto.completedCount ?? 0;
      const totalDays = dto.totalDays ?? 0;
      const failedCount = Math.max(0, totalDays - completedCount);
      const rate = totalDays === 0 ? 0 : (completedCount * 100) / totalDays;

      this.completedCount = completedCount;
      this.failedCount = failedCount;
      this.totalDays = totalDays;
      this.rate = rate;

      this.buildHeatmap(dto);
      this.loading = false;
    } catch (err: any) {
      if (err?.status === 404) {
        this.error = `Habit ${this.habitId} was not found.`;
      } else {
        this.error = err instanceof Error ? err.message : String(err);
      }
      this.loading = false;
    }
  }

  private buildHeatmap(dto: HabitDto): void {
    const completedDates = new Set(
      (dto.entries ?? []).filter((e) => e.completed).map((e) => e.entryDate)
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
        const iso = this.toISODate(cellDate);
        const isFuture = cellDate > today;

        if (isFuture) {
          cells.push({ visible: false, level: -1, tooltip: '' });
        } else {
          const level = completedDates.has(iso) ? 4 : 0;
          cells.push({
            visible: true,
            level,
            tooltip: `${iso} — ${level > 0 ? 'completed' : 'not completed'}`,
          });
        }
      }
    }

    this.heatmapCells = cells;

    // month labels with minimum spacing
    const MIN_COL_GAP = 3;
    let lastLabelCol = -Infinity;
    const labels: { text: string; col: number }[] = [];

    for (let w = 0; w < HEATMAP_WEEKS; w++) {
      const month = monthPerCol[w];
      const prevMonth = w > 0 ? monthPerCol[w - 1] : null;
      if (month === prevMonth) continue;
      if (w - lastLabelCol < MIN_COL_GAP) continue;
      labels.push({ text: MONTH_LABELS[month], col: w + 1 });
      lastLabelCol = w;
    }
    this.monthLabels = labels;
  }

  // ---------- edit ----------
  openEdit(): void {
    if (!this.habit) return;
    this.editName = this.habit.name;
    this.editDescription = this.habit.description ?? '';
    this.editPriority = this.habit.priority;
    this.editError = null;
    this.editOpen = true;
  }

  closeEdit(): void {
    this.editOpen = false;
  }

  async submitEdit(): Promise<void> {
    const name = this.editName.trim();
    if (!name) {
      this.editError = 'Please enter a habit name.';
      return;
    }
    const description = this.editDescription.trim() || null;
    const priority = this.editPriority;

    this.editSaving = true;
    this.editError = null;

    try {
      const updated = await this.habitService.update(this.habitId, { name, priority, description });
      this.habit = updated;
      this.color = this.pickColor(updated.id);
      // refresh computed stats
      const completedCount = updated.completedCount ?? 0;
      const totalDays = updated.totalDays ?? 0;
      this.completedCount = completedCount;
      this.totalDays = totalDays;
      this.failedCount = Math.max(0, totalDays - completedCount);
      this.rate = totalDays === 0 ? 0 : (completedCount * 100) / totalDays;
      this.closeEdit();
    } catch (err) {
      this.editError = err instanceof Error ? err.message : String(err);
    } finally {
      this.editSaving = false;
    }
  }

  // ---------- delete ----------
  openDelete(): void {
    if (!this.habit) return;
    const n = this.habit.name;
    this.deleteDisplayName = n.length > 60 ? n.slice(0, 60).trimEnd() + '…' : n;
    this.deleteError = null;
    this.deleteOpen = true;
  }

  closeDelete(): void {
    this.deleteOpen = false;
  }

  async confirmDelete(): Promise<void> {
    this.deleteSaving = true;
    this.deleteError = null;
    try {
      await this.habitService.delete(this.habitId);
      await this.router.navigate(['/habits']);
    } catch (err) {
      this.deleteError = err instanceof Error ? err.message : String(err);
      this.deleteSaving = false;
    }
  }
}