import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { CategoryFilters } from '../../../core/models/filter.model';
import { Task } from '../../../core/models/task.model';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { AddEditModalComponent } from '../add-edit-modal/add-edit-modal';
import { FilterModalComponent } from '../filter-modal/filter-modal';

interface CategoryTableRow {
  id: string;
  kind: 'category' | 'task';
  category: Category;
  task?: Task;
  isFilteredTask: boolean;
}

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, AddEditModalComponent, FilterModalComponent],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css'
})
export class CategoryListComponent implements OnInit {
  private readonly api = inject(CategoryApiService);

  readonly categories = signal<Category[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly filters = signal<CategoryFilters>({ categoryName: '', taskType: '' });

  showAddPanel = false;
  showFilterPanel = false;

  readonly visibleRows = computed<CategoryTableRow[]>(() => {
    const filters = this.filters();
    const categoryName = filters.categoryName.trim().toLowerCase();
    const taskType = filters.taskType;
    const rows: CategoryTableRow[] = [];

    for (const category of this.categories()) {
      const categoryMatches = !categoryName || category.name.toLowerCase().includes(categoryName);

      if (!categoryMatches) {
        continue;
      }

      const categoryTasks = this.tasks().filter((task) => {
        const belongsToCategory = this.getTaskCategoryId(task) === category._id;
        const matchesType = !taskType || task.type === taskType;
        return belongsToCategory && matchesType;
      });

      if (taskType && categoryTasks.length === 0) {
        continue;
      }

      rows.push({
        id: category._id,
        kind: 'category',
        category,
        isFilteredTask: false
      });

      for (const task of categoryTasks) {
        rows.push({
          id: task._id,
          kind: 'task',
          category,
          task,
          isFilteredTask: Boolean(taskType)
        });
      }
    }

    return rows;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      categories: this.api.getCategories(),
      tasks: this.api.getTasks()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ categories, tasks }) => {
          this.categories.set(categories);
          this.tasks.set(tasks);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.extractError(error, 'Unable to load categories. Confirm the backend and MongoDB are running.'));
        }
      });
  }

  openAddPanel(): void {
    this.showAddPanel = true;
  }

  closeAddPanel(): void {
    this.showAddPanel = false;
  }

  handleSaved(): void {
    this.showAddPanel = false;
    this.loadData();
  }

  applyFilters(filters: CategoryFilters): void {
    this.filters.set(filters);
    this.showFilterPanel = false;
  }

  clearFilters(): void {
    this.filters.set({ categoryName: '', taskType: '' });
    this.showFilterPanel = false;
  }

  hasActiveFilters(): boolean {
    const filters = this.filters();
    return Boolean(filters.categoryName.trim() || filters.taskType);
  }

  labelFor(row: CategoryTableRow): string {
    if (row.kind === 'category') {
      const taskCount = this.tasks().filter((task) => this.getTaskCategoryId(task) === row.category._id).length;
      return `${row.category.name} : ${taskCount || '--'}`;
    }

    return `${row.task?.name || ''} : --`;
  }

  descriptionFor(row: CategoryTableRow): string {
    return row.task?.description || row.category.description || '--';
  }

  priceFor(row: CategoryTableRow, key: 'lead' | 'call' | 'appointment'): string {
    const value = row.task?.price?.[key]?.trim();

    if (!value) {
      return '--';
    }

    return value.startsWith('$') ? value : `$${value}`;
  }

  trackRow(_index: number, row: CategoryTableRow): string {
    return `${row.kind}-${row.id}`;
  }

  private getTaskCategoryId(task: Task): string {
    return typeof task.categoryId === 'string' ? task.categoryId : task.categoryId._id;
  }

  private extractError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const httpError = error as { error?: { message?: string } };
      return httpError.error?.message || fallback;
    }

    return fallback;
  }
}
