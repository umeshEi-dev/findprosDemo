import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryPayload } from '../models/category.model';
import { CategoryFilters } from '../models/filter.model';
import { Location, LocationPricingPayload, MultiLocationPricingPayload, ZipcodeResult } from '../models/location.model';
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

  updateCategory(id: string, payload: CreateCategoryPayload): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, payload);
  }

  getTasks(filters?: Partial<CategoryFilters> & { categoryId?: string }): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params });
  }

  createTask(payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, payload);
  }

  updateTask(id: string, payload: CreateTaskPayload): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, payload);
  }

  getLocation(search: string): Observable<Location[]> {
    const params = new HttpParams().set('search', search);
    return this.http.get<Location[]>(`${this.apiUrl}/get-location`, { params });
  }

  getZipcode(city?: string, state?: string, country?: string, type?: string): Observable<ZipcodeResult[]> {
    let params = new HttpParams();
    if (city) params = params.set('city', city);
    if (state) params = params.set('state', state);
    if (country) params = params.set('country', country);
    if (type) params = params.set('type', type);
    return this.http.get<ZipcodeResult[]>(`${this.apiUrl}/get-zipcode`, { params });
  }

  saveLocationPricing(payload: LocationPricingPayload | MultiLocationPricingPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/task-location`, payload);
  }

  getLocationPricing(categoryId: string, taskId?: string): Observable<any[]> {
    let params = new HttpParams().set('category_id', categoryId);
    if (taskId) params = params.set('task_id', taskId);
    return this.http.get<any[]>(`${this.apiUrl}/task-location`, { params });
  }
}
