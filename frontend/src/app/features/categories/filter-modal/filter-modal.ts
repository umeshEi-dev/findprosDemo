import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { CategoryFilters } from '../../../core/models/filter.model';

@Component({
  selector: 'app-filter-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.css'
})
export class FilterModalComponent implements OnChanges {
  @Input() categories: Category[] = [];
  @Input() filters: CategoryFilters = { categoryName: '' };
  @Output() applied = new EventEmitter<CategoryFilters>();
  @Output() cleared = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    categoryName: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.form.patchValue(this.filters, { emitEvent: false });
    }
  }

  apply(): void {
    this.applied.emit(this.form.getRawValue());
  }

  clear(): void {
    this.form.reset({ categoryName: '' });
    this.cleared.emit();
  }
}
