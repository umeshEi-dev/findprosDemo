import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { OnboardingService } from '../../../core/onboarding.service';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css'
})
export class UserDashboardComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly onboarding = inject(OnboardingService);

  readonly form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  loading = false;
  errorMessage = '';
  showPasswordModal = this.auth.user()?.status === 'pending';

  get authUser() {
    return this.auth.user();
  }

  get localServiceAreas() {
    return this.onboarding.serviceAreas;
  }

  get localCategories() {
    return this.onboarding.categories;
  }

  submitPassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.setPassword(password)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.showPasswordModal = false;
          this.onboarding.clear();
        },
        error: error => {
          this.errorMessage = error?.error?.message || 'Unable to set password. Please try again.';
        }
      });
  }

  logout(): void {
    this.auth.logout();
  }
}
