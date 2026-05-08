import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OnboardingService } from '../../../core/onboarding.service';

@Component({
  selector: 'app-signup-step3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup-step3.html',
  styleUrl: './signup-step3.css'
})
export class SignupStep3Component {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    companyName: ['', [Validators.required, Validators.maxLength(120)]],
    businessAddress: ['', [Validators.required, Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    state: ['', [Validators.required, Validators.maxLength(80)]],
    zipcode: ['', [Validators.required, Validators.maxLength(20)]]
  });

  constructor() {
    const businessInfo = this.onboarding.businessInfo;
    if (businessInfo) {
      this.form.patchValue(businessInfo);
    }
  }

  next(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.onboarding.setBusinessInfo({
      ...this.form.getRawValue(),
      acceptedTerms: this.onboarding.businessInfo?.acceptedTerms ?? false
    });

    this.router.navigate(['/signup/step4']);
  }
}
