import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { TaskType } from '../../../core/models/task.model';
import { CategoryApiService } from '../../../core/services/category-api.service';

type AddMode = 'category' | 'task';

@Component({
  selector: 'app-add-edit-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-modal.html',
  styleUrl: './add-edit-modal.css'
})
export class AddEditModalComponent {
  @Input() categories: Category[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(CategoryApiService);

  readonly taskTypes: TaskType[] = ['Lead', 'Call', 'Appointment'];
  mode: AddMode = 'category';
  saving = false;
  errorMessage = '';

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    categoryId: ['', Validators.required],
    description: ['']
  });

  readonly taskForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    categoryId: ['', Validators.required],
    description: [''],
    priceLead: [''],
    priceCall: [''],
    priceAppointment: [''],
    type: ['Lead' as TaskType, Validators.required]
  });

  setMode(mode: AddMode): void {
    this.mode = mode;
    this.errorMessage = '';
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.api
      .createCategory(this.categoryForm.getRawValue())
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.categoryForm.reset();
          this.saved.emit();
        },
        error: (error: unknown) => {
          this.errorMessage = this.extractError(error, 'Unable to save category.');
        }
      });
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const value = this.taskForm.getRawValue();
    this.saving = true;
    this.errorMessage = '';

    this.api
      .createTask({
        name: value.name,
        categoryId: value.categoryId,
        description: value.description,
        price: {
          lead: value.priceLead,
          call: value.priceCall,
          appointment: value.priceAppointment
        },
        type: value.type
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.taskForm.reset({ type: 'Lead' });
          this.saved.emit();
        },
        error: (error: unknown) => {
          this.errorMessage = this.extractError(error, 'Unable to save task.');
        }
      });
  }

  private extractError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const httpError = error as { error?: { message?: string } };
      return httpError.error?.message || fallback;
    }

    return fallback;
  }
}
