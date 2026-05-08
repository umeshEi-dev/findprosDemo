import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login/login';
import { SignupComponent } from './features/auth/signup/signup';
import { SignupStep1Component } from './features/auth/signup-step1/signup-step1';
import { SignupStep2Component } from './features/auth/signup-step2/signup-step2';
import { SignupStep3Component } from './features/auth/signup-step3/signup-step3';
import { SignupStep4Component } from './features/auth/signup-step4/signup-step4';
import { CategoryListComponent } from './features/categories/category-list/category-list';
import { AuthRedirectComponent } from './features/shell/auth-redirect/auth-redirect';
import { UserDashboardComponent } from './features/user/user-dashboard/user-dashboard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: AuthRedirectComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicOnlyGuard]
  },
  {
    path: 'signup',
    canActivate: [publicOnlyGuard],
    children: [
      {
        path: '',
        component: SignupComponent
      },
      {
        path: 'step1',
        component: SignupStep1Component
      },
      {
        path: 'step2',
        component: SignupStep2Component
      },
      {
        path: 'step3',
        component: SignupStep3Component
      },
      {
        path: 'step4',
        component: SignupStep4Component
      }
    ]
  },
  {
    path: 'admin',
    component: CategoryListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: UserDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
