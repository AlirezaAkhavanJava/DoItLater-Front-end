import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TaskDto, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);

  tasks = signal<TaskDto[]>([]);
  loading = true;
  loadError: string | null = null;

  filter: 'ALL' | 'OPEN' | 'COMPLETE' = 'ALL';

  // create form
  formTitle = '';
  formDescription = '';
  formDueDate = '';
  formPriority: TaskPriority = 'MEDIUM';
  formMessage = '';

  // edit modal
  editOpen = false;
  editId = 0;
  editTitle = '';
  editDescription = '';
  editDueDate = '';
  editPriority: TaskPriority = 'MEDIUM';
  editStatus: TaskStatus = 'OPEN';
  editMessage = '';
  editSaving = false;

  // delete modal
  deleteOpen = false;
  deleteId = 0;
  deleteTitle = '';

  toastMsg = '';
  toastError = false;
  private toastTimer: any;

  todayLabel = '';

  ngOnInit(): void {
    this.todayLabel = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
    void this.loadTasks();
  }

  // ---------- summary ----------
  get totalCount(): number { return this.tasks().length; }
  get completedCount(): number { return this.tasks().filter((t) => t.status === 'COMPLETE').length; }
  get openCount(): number { return this.totalCount - this.completedCount; }

  get filteredTasks(): TaskDto[] {
    if (this.filter === 'ALL') return this.tasks();
    return this.tasks().filter((t) => t.status === this.filter);
  }

  // ---------- data ----------
  async loadTasks(): Promise<void> {
    this.loading = true;
    this.loadError = null;
    try {
      this.tasks.set(await this.taskService.list());
    } catch (err: any) {
      this.loadError = 'Could not connect to the backend. Make sure Spring Boot is running.';
      this.showToast(err?.message ?? 'Could not load tasks.', true);
    } finally {
      this.loading = false;
    }
  }

  async createTask(): Promise<void> {
    const payload = {
      title: this.formTitle.trim(),
      description: this.formDescription.trim() || null,
      dueDate: this.formDueDate || null,
      priority: this.formPriority,
    };
    try {
      await this.taskService.create(payload);
      this.formTitle = '';
      this.formDescription = '';
      this.formDueDate = '';
      this.formPriority = 'MEDIUM';
      this.formMessage = '';
      this.showToast('Task created successfully.');
      await this.loadTasks();
    } catch (err: any) {
      this.formMessage = err?.error?.message ?? err?.message ?? 'Could not create task.';
    }
  }

  async toggleStatus(task: TaskDto): Promise<void> {
    const next: TaskStatus = task.status === 'COMPLETE' ? 'OPEN' : 'COMPLETE';
    try {
      await this.taskService.update(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: next,
      });
      this.showToast(next === 'COMPLETE' ? 'Task marked complete.' : 'Task marked open.');
      await this.loadTasks();
    } catch (err: any) {
      this.showToast(err?.message ?? 'Could not update task status.', true);
    }
  }

  // ---------- edit ----------
  openEdit(task: TaskDto): void {
    this.editId = task.id;
    this.editTitle = task.title;
    this.editDescription = task.description ?? '';
    this.editDueDate = task.dueDate ?? '';
    this.editPriority = task.priority;
    this.editStatus = task.status;
    this.editMessage = '';
    this.editOpen = true;
  }

  closeEdit(): void {
    this.editOpen = false;
  }

  async saveEdit(): Promise<void> {
    this.editSaving = true;
    this.editMessage = '';
    try {
      await this.taskService.update(this.editId, {
        title: this.editTitle.trim(),
        description: this.editDescription.trim() || null,
        dueDate: this.editDueDate || null,
        priority: this.editPriority,
        status: this.editStatus,
      });
      this.closeEdit();
      this.showToast('Task updated successfully.');
      await this.loadTasks();
    } catch (err: any) {
      this.editMessage = err?.error?.message ?? err?.message ?? 'Could not update task.';
    } finally {
      this.editSaving = false;
    }
  }

  // ---------- delete ----------
  openDelete(task: TaskDto): void {
    this.deleteId = task.id;
    this.deleteTitle = task.title;
    this.deleteOpen = true;
  }

  closeDelete(): void {
    this.deleteOpen = false;
  }

  async confirmDelete(): Promise<void> {
    try {
      await this.taskService.delete(this.deleteId);
      this.closeDelete();
      this.showToast('Task deleted successfully.');
      await this.loadTasks();
    } catch (err: any) {
      this.showToast(err?.message ?? 'Could not delete task.', true);
    }
  }

  // ---------- misc ----------
  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${dateString}T00:00:00`));
  }

  capitalize(v: string): string {
    const s = String(v ?? '').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  showToast(message: string, isError = false): void {
    this.toastMsg = message;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMsg = '';
    }, 3500);
  }
}