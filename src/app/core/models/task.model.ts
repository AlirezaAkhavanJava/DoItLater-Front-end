export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'OPEN' | 'COMPLETE';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface CreateTaskRequest {
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
}

export interface UpdateTaskRequest extends CreateTaskRequest {
  status: TaskStatus;
}