export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'OPEN' | 'COMPLETE';

export interface TaskDto {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface CreateTaskRequestDto {
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
}

export interface UpdateTaskRequestDto {
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}