import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { CategoryApiService } from '../../../core/services/category-api.service';

type AddMode = 'category' | 'task';

@Component({
  selector: 'app-add-edit-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-modal.html',
  styleUrl: './add-edit-modal.css'
})
export class AddEditModalComponent implements OnChanges {
  @Input() categories: Category[] = [];
  @Input() editItem?: { kind: 'category' | 'task'; data: any };
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(CategoryApiService);


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
    priceAppointment: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editItem']) {
      if (this.editItem) {
        this.mode = this.editItem.kind;
        if (this.mode === 'category') {
          this.categoryForm.patchValue(this.editItem.data);
        } else {
          const task = this.editItem.data as any; // Using any to access fields easily
          this.taskForm.patchValue({
            name: task.name,
            categoryId: typeof task.categoryId === 'string' ? task.categoryId : task.categoryId?._id,
            description: task.description,
            priceLead: task.price?.lead || '',
            priceCall: task.price?.call || '',
            priceAppointment: task.price?.appointment || ''
          });
        }
      } else {
        this.mode = 'category';
        this.categoryForm.reset();
        this.taskForm.reset();
      }
    }
  }

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

    const payload = this.categoryForm.getRawValue();
    const request$ = this.editItem?.kind === 'category'
      ? this.api.updateCategory(this.editItem.data._id, payload)
      : this.api.createCategory(payload);

    request$
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

    const payload = {
      name: value.name,
      categoryId: value.categoryId,
      description: value.description,
      price: {
        lead: value.priceLead,
        call: value.priceCall,
        appointment: value.priceAppointment
      }
    };

    const request$ = this.editItem?.kind === 'task'
      ? this.api.updateTask(this.editItem.data._id, payload)
      : this.api.createTask(payload);

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.taskForm.reset();
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
