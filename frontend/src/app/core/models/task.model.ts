import type { Category } from './category.model';

export type TaskType = 'Lead' | 'Call' | 'Appointment';

export interface PriceInfo {
  lead: string;
  call: string;
  appointment: string;
}

export interface Task {
  _id: string;
  name: string;
  categoryId: string | Category;
  description: string;
  price: PriceInfo;
  type: TaskType;
  createdAt: string;
}

export interface CreateTaskPayload {
  name: string;
  categoryId: string;
  description: string;
  price: PriceInfo;
  type: TaskType;
}
