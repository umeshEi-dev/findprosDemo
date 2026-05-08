import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { OnboardingService } from '../../../core/onboarding.service';
import { Category } from '../../../core/models/category.model';
import { OnboardingCategory } from '../../../core/auth/auth.model';

@Component({
  selector: 'app-signup-step2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup-step2.html',
  styleUrl: './signup-step2.css'
})
export class SignupStep2Component {
  private readonly categoryApi = inject(CategoryApiService);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  searchControl = new FormControl('', { nonNullable: true, validators: [Validators.minLength(2)] });
  categories: Category[] = [];
  selectedCategories: OnboardingCategory[] = [...this.onboarding.categories];
  loading = false;
  errorMessage = '';

  constructor() {
    this.fetchCategories();
  }

  get filteredCategories(): Category[] {
    const filter = this.searchControl.value.trim().toLowerCase();
    if (!filter) {
      return this.categories;
    }

    return this.categories.filter(category => category.name.toLowerCase().includes(filter));
  }

  fetchCategories(): void {
    this.loading = true;
    this.categoryApi.getCategories()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: categories => {
          this.categories = categories;
        },
        error: () => {
          this.errorMessage = 'Unable to load service categories. Please try again.';
        }
      });
  }

  addCategory(category: Category): void {
    const exists = this.selectedCategories.some(item => item.categoryId === category._id);
    if (exists) {
      return;
    }

    this.selectedCategories = [
      ...this.selectedCategories,
      { categoryId: category._id, name: category.name }
    ];
  }

  removeCategory(index: number): void {
    this.selectedCategories = this.selectedCategories.filter((_, i) => i !== index);
  }

  next(): void {
    if (!this.selectedCategories.length) {
      this.errorMessage = 'Please select at least one service category.';
      return;
    }

    this.onboarding.setCategories(this.selectedCategories);
    this.router.navigate(['/signup/step3']);
  }
}
