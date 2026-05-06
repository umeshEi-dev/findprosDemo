import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryPayload } from '../models/category.model';
import { CategoryFilters } from '../models/filter.model';
import { CreateTaskPayload, Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createCategory(payload: CreateCategoryPayload): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, payload);
  }

  getTasks(filters?: Partial<CategoryFilters> & { categoryId?: string }): Observable<Task[]> {
    let params = new HttpParams();

    if (filters?.taskType) {
      params = params.set('type', filters.taskType);
    }

    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }

    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params });
  }

  createTask(payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, payload);
  }
}
