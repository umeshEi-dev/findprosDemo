import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { OnboardingService } from '../../../core/onboarding.service';

@Component({
  selector: 'app-signup-step4',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './signup-step4.html',
  styleUrl: './signup-step4.css'
})
export class SignupStep4Component {
  private readonly onboarding = inject(OnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  acceptedTerms = this.onboarding.businessInfo?.acceptedTerms ?? false;
  loading = false;
  errorMessage = '';

  get serviceAreas() {
    return this.onboarding.serviceAreas;
  }

  get categories() {
    return this.onboarding.categories;
  }

  get businessInfo() {
    return this.onboarding.businessInfo;
  }

  acceptTerms(): void {
    this.acceptedTerms = !this.acceptedTerms;
    if (this.businessInfo) {
      this.onboarding.setBusinessInfo({ ...this.businessInfo, acceptedTerms: this.acceptedTerms });
    }
  }

  submit(): void {
    if (!this.businessInfo || !this.acceptedTerms) {
      this.errorMessage = 'You must accept the Privacy Policy and Terms & Conditions to continue.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.signUpOnboarding(this.onboarding.getPayload())
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: user => {
          this.router.navigate(['/dashboard']);
        },
        error: error => {
          this.errorMessage = error?.error?.message || 'Unable to create account. Please try again.';
        }
      });
  }
}
