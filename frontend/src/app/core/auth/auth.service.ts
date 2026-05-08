import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginPayload, SignUpPayload } from './auth.model';

const USER_STORAGE_KEY = 'findpros.auth.user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');

  signUp(payload: SignUpPayload): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, payload).pipe(
      map(response => response.user),
      tap(user => this.setUser(user))
    );
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      map(response => response.user),
      tap(user => this.setUser(user))
    );
  }

  loadCurrentUser(): Observable<AuthUser | null> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/me`).pipe(
      map(response => response.user),
      tap(user => this.setUser(user)),
      catchError(() => {
        this.clearUser();
        return of(null);
      })
    );
  }

  logout(): void {
    this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of(undefined))
    ).subscribe(() => {
      this.clearUser();
      this.router.navigate(['/login']);
    });
  }

  redirectAfterAuth(user: AuthUser): void {
    this.router.navigate([user.role === 'admin' ? '/admin' : '/user']);
  }

  hasAllowedRole(roles?: string[]): boolean {
    const user = this.userSignal();
    return !roles?.length || (!!user && roles.includes(user.role));
  }

  private setUser(user: AuthUser): void {
    this.userSignal.set(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private clearUser(): void {
    this.userSignal.set(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private readStoredUser(): AuthUser | null {
    try {
      const value = localStorage.getItem(USER_STORAGE_KEY);
      return value ? JSON.parse(value) as AuthUser : null;
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }
}
