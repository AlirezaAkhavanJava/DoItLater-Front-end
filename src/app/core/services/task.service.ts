import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api.config';
import {
  CreateTaskRequestDto,
  TaskDto,
  UpdateTaskRequestDto,
} from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/tasks`;

  list(): Promise<TaskDto[]> {
    return firstValueFrom(this.http.get<TaskDto[]>(this.base));
  }

  create(payload: CreateTaskRequestDto): Promise<TaskDto> {
    return firstValueFrom(this.http.post<TaskDto>(`${this.base}/createTask`, payload));
  }

  update(id: number, payload: UpdateTaskRequestDto): Promise<TaskDto> {
    return firstValueFrom(this.http.put<TaskDto>(`${this.base}/${id}`, payload));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/delete/${id}`));
  }
}