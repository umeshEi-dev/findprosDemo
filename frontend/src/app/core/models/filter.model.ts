import { TaskType } from './task.model';

export interface CategoryFilters {
  categoryName: string;
  taskType: TaskType | '';
}
