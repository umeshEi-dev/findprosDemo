import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { OnboardingService } from '../../../core/onboarding.service';
import { Location } from '../../../core/models/location.model';
import { OnboardingServiceArea } from '../../../core/auth/auth.model';

@Component({
  selector: 'app-signup-step1',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup-step1.html',
  styleUrl: './signup-step1.css'
})
export class SignupStep1Component {
  private readonly categoryApi = inject(CategoryApiService);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  searchControl = new FormControl('', { nonNullable: true, validators: [Validators.minLength(2)] });
  suggestions: Location[] = [];
  selectedAreas: OnboardingServiceArea[] = [...this.onboarding.serviceAreas];
  loading = false;
  errorMessage = '';

  get hasSelectedAreas(): boolean {
    return this.selectedAreas.length > 0;
  }

  search(): void {
    const query = this.searchControl.value.trim();
    if (query.length < 2) {
      this.suggestions = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.categoryApi.getLocation(query)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: locations => {
          this.suggestions = locations;
        },
        error: () => {
          this.suggestions = [];
          this.errorMessage = 'Unable to load location suggestions. Please try again.';
        }
      });
  }

  addLocation(location: Location, mode: 'include' | 'exclude'): void {
    const exists = this.selectedAreas.some(area => area.locationId === location._id && area.mode === mode);
    if (exists) {
      return;
    }

    this.selectedAreas = [
      ...this.selectedAreas,
      {
        locationId: location._id,
        location: `${location.location}, ${location.state}`,
        city: location.city,
        state: location.state,
        mode
      }
    ];
  }

  removeArea(index: number): void {
    this.selectedAreas = this.selectedAreas.filter((_, i) => i !== index);
  }

  toggleMode(index: number): void {
    const copied = [...this.selectedAreas];
    copied[index] = {
      ...copied[index],
      mode: copied[index].mode === 'include' ? 'exclude' : 'include'
    };
    this.selectedAreas = copied;
  }

  next(): void {
    if (!this.hasSelectedAreas) {
      this.errorMessage = 'Please select at least one location to include or exclude.';
      return;
    }

    this.onboarding.setServiceAreas(this.selectedAreas);
    this.router.navigate(['/signup/step2']);
  }
}
