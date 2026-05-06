import type { Task } from './task.model';

export interface Category {
  _id: string;
  name: string;
  categoryId: string;
  description: string;
  createdAt: string;
  taskCount?: number;
  tasks?: Task[];
}

export interface CreateCategoryPayload {
  name: string;
  categoryId: string;
  description: string;
}
