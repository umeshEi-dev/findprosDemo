import type { Category } from './category.model';

export interface PriceInfo {
  lead: string;
  call: string;
  appointment: string;
}

export interface Task {
  _id: string;
  name: string;
  categoryId: string | Category;
  categoryIds?: Array<string | Category>;
  description: string;
  price: PriceInfo;
  createdAt: string;
}

export interface CreateTaskPayload {
  name: string;
  categoryId?: string;
  categoryIds?: string[];
  description: string;
  price: PriceInfo;
}
