import { Injectable, signal } from '@angular/core';
import { OnboardingCategory, OnboardingServiceArea } from './auth/auth.model';

export interface OnboardingBusinessInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  businessAddress: string;
  city: string;
  state: string;
  zipcode: string;
  acceptedTerms: boolean;
}

export interface OnboardingState {
  serviceAreas: OnboardingServiceArea[];
  categories: OnboardingCategory[];
  businessInfo: OnboardingBusinessInfo | null;
}

const STORAGE_KEY = 'findpros.onboarding';

const initialState: OnboardingState = {
  serviceAreas: [],
  categories: [],
  businessInfo: null
};

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private stateSignal = signal<OnboardingState>(this.loadState());

  readonly state = this.stateSignal.asReadonly();

  get serviceAreas(): OnboardingServiceArea[] {
    return this.stateSignal().serviceAreas;
  }

  get categories(): OnboardingCategory[] {
    return this.stateSignal().categories;
  }

  get businessInfo(): OnboardingBusinessInfo | null {
    return this.stateSignal().businessInfo;
  }

  setServiceAreas(serviceAreas: OnboardingServiceArea[]): void {
    this.updateState({ serviceAreas });
  }

  setCategories(categories: OnboardingCategory[]): void {
    this.updateState({ categories });
  }

  setBusinessInfo(businessInfo: OnboardingBusinessInfo): void {
    this.updateState({ businessInfo });
  }

  clear(): void {
    this.stateSignal.set(initialState);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  getPayload(): OnboardingBusinessInfo & { serviceAreas: OnboardingServiceArea[]; categories: OnboardingCategory[] } {
    const state = this.stateSignal();
    return {
      ...state.businessInfo!,
      serviceAreas: state.serviceAreas,
      categories: state.categories
    };
  }

  private updateState(partial: Partial<OnboardingState>): void {
    const next = { ...this.stateSignal(), ...partial };
    this.stateSignal.set(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadState(): OnboardingState {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as OnboardingState : initialState;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
  }
}
