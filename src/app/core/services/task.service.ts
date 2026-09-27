import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTaskRequest, Task, UpdateTaskRequest } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/api/v1/tasks';

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.base);
  }

  create(payload: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.base}/createTask`, payload);
  }

  update(id: number, payload: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }
}