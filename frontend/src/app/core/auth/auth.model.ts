export type UserRole = 'user' | 'admin';

export interface OnboardingServiceArea {
  locationId: string;
  location: string;
  city?: string;
  state?: string;
  mode: 'include' | 'exclude';
}

export interface OnboardingCategory {
  categoryId: string;
  name: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: 'pending' | 'active' | 'inactive' | 'disabled';
  serviceAreas?: OnboardingServiceArea[];
  categories?: OnboardingCategory[];
  companyName?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  phone?: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends LoginPayload {
  name: string;
}

export interface OnboardingCategory {
  categoryId: string;
  name: string;
}

export interface OnboardingServiceArea {
  locationId: string;
  location: string;
  city?: string;
  state?: string;
  mode: 'include' | 'exclude';
}

export interface SignUpOnboardingPayload {
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
  serviceAreas: OnboardingServiceArea[];
  categories: OnboardingCategory[];
}
