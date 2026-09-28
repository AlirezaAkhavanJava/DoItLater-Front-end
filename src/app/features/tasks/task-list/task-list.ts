import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

type Filter = 'ALL' | 'OPEN' | 'COMPLETE';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeToggleComponent],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);

  protected readonly tasks = signal<Task[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly filter = signal<Filter>('ALL');
  protected readonly toast = signal<{ message: string; error: boolean } | null>(null);

  // New task form
  protected readonly newTask = signal({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM' as TaskPriority,
  });
  protected readonly formMessage = signal<string | null>(null);

  // Edit modal
  protected readonly editOpen = signal(false);
  protected readonly editModel = signal({
    id: 0,
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'OPEN' as TaskStatus,
  });
  protected readonly editMessage = signal<string | null>(null);
  protected readonly editSaving = signal(false);

  // Delete modal
  protected readonly deleteOpen = signal(false);
  protected readonly deleteTarget = signal<Task | null>(null);
  protected readonly deleteSaving = signal(false);

  // Summary
  protected readonly totalTasks = computed(() => this.tasks().length);
  protected readonly openTasks = computed(
    () => this.tasks().filter((t) => t.status === 'OPEN').length,
  );
  protected readonly completedTasks = computed(
    () => this.tasks().filter((t) => t.status === 'COMPLETE').length,
  );

  // Filtered list
  protected readonly filteredTasks = computed(() => {
    const f = this.filter();
    return this.tasks().filter((t) => f === 'ALL' || t.status === f);
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  // ---- Formatters ----
  formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(`${iso}T00:00:00`));
  }

  capitalize(v: unknown): string {
    const s = String(v ?? '').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  todayLabel(): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    }).format(new Date());
  }

  // ---- Data ----
  loadTasks(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.taskService.list().subscribe({
      next: (data) => { this.tasks.set(data); this.loading.set(false); },
      error: (err) => {
        console.error(err);
        this.loadError.set('Could not connect to the backend. Make sure Spring Boot is running.');
        this.loading.set(false);
      },
    });
  }

  // ---- Create ----
  createTask(event: Event): void {
    event.preventDefault();
    const t = this.newTask();
    const title = t.title.trim();
    if (!title) return;

    this.formMessage.set(null);

    this.taskService
      .create({
        title,
        description: t.description.trim() || null,
        dueDate: t.dueDate || null,
        priority: t.priority,
      })
      .subscribe({
        next: () => {
          this.newTask.set({ title: '', description: '', dueDate: '', priority: 'MEDIUM' });
          this.showToast('Task created successfully.');
          this.loadTasks();
        },
        error: (err) => this.formMessage.set(err?.error?.message ?? 'Could not create task.'),
      });
  }

  // ---- Toggle ----
  toggleStatus(task: Task): void {
    const next: TaskStatus = task.status === 'COMPLETE' ? 'OPEN' : 'COMPLETE';
    this.taskService
      .update(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: next,
      })
      .subscribe({
        next: () => {
          this.showToast(next === 'COMPLETE' ? 'Task marked complete.' : 'Task marked open.');
          this.loadTasks();
        },
        error: (err) => this.showToast(err?.error?.message ?? 'Could not update.', true),
      });
  }

  // ---- Edit ----
  openEdit(task: Task): void {
    this.editModel.set({
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      dueDate: task.dueDate ?? '',
      priority: task.priority,
      status: task.status,
    });
    this.editMessage.set(null);
    this.editOpen.set(true);
  }

  closeEdit(): void { this.editOpen.set(false); }

  saveEdit(event: Event): void {
    event.preventDefault();
    const m = this.editModel();
    if (!m.title.trim()) return;

    this.editSaving.set(true);
    this.editMessage.set(null);

    this.taskService
      .update(m.id, {
        title: m.title.trim(),
        description: m.description.trim() || null,
        dueDate: m.dueDate || null,
        priority: m.priority,
        status: m.status,
      })
      .subscribe({
        next: () => {
          this.closeEdit();
          this.showToast('Task updated successfully.');
          this.loadTasks();
        },
        error: (err) => {
          this.editMessage.set(err?.error?.message ?? 'Could not update task.');
          this.editSaving.set(false);
        },
        complete: () => this.editSaving.set(false),
      });
  }

  // ---- Delete ----
  openDelete(task: Task): void {
    this.deleteTarget.set(task);
    this.deleteOpen.set(true);
  }

  closeDelete(): void { this.deleteOpen.set(false); }

  confirmDelete(): void {
    const t = this.deleteTarget();
    if (!t) return;

    this.deleteSaving.set(true);
    this.taskService.delete(t.id).subscribe({
      next: () => {
        this.closeDelete();
        this.showToast('Task deleted successfully.');
        this.loadTasks();
      },
      error: (err) => {
        this.showToast(err?.error?.message ?? 'Could not delete task.', true);
        this.deleteSaving.set(false);
      },
      complete: () => this.deleteSaving.set(false),
    });
  }

  showToast(message: string, error = false): void {
    this.toast.set({ message, error });
    setTimeout(() => this.toast.set(null), 3500);
  }
}